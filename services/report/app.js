const RabbitMQService = require('./rabbitmq-service');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Estrutura para armazenar os relatórios
const report = {
    totalSales: 0,
    totalRevenue: 0,
    products: {},
    clients: new Set()
};

async function updateReport(orderData) {
    try {
        // Atualiza contagem geral
        report.totalSales++;
        
        // Atualiza receita total
        const orderTotal = orderData.products.reduce((sum, product) => sum + parseFloat(product.value), 0);
        report.totalRevenue += orderTotal;
        
        // Atualiza contagem por produto
        for (const product of orderData.products) {
            if (!product.name) continue;
            
            if (!report.products[product.name]) {
                report.products[product.name] = {
                    count: 1,
                    totalValue: parseFloat(product.value)
                };
            } else {
                report.products[product.name].count++;
                report.products[product.name].totalValue += parseFloat(product.value);
            }
        }
        
        // Registra cliente único
        if (orderData.email) {
            report.clients.add(orderData.email);
        }
        
        // Imprime relatório atualizado
        await printReport();
    } catch (error) {
        console.error('Erro ao atualizar relatório:', error);
    }
}

async function printReport() {
    console.log('\n=== RELATÓRIO ATUALIZADO ===');
    console.log(`Total de vendas: ${report.totalSales}`);
    console.log(`Receita total: R$ ${report.totalRevenue.toFixed(2)}`);
    console.log(`Clientes únicos: ${report.clients.size}`);
    
    console.log('\nVendas por produto:');
    for (const [productName, data] of Object.entries(report.products)) {
        console.log(`- ${productName}: ${data.count} vendas (R$ ${data.totalValue.toFixed(2)})`);
    }
    console.log('============================\n');
}

async function processMessage(msg) {
    try {
        const orderData = JSON.parse(msg.content.toString());
        console.log('Nova mensagem recebida:', orderData);
        await updateReport(orderData);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
}

async function consume() {
    try {
        console.log('Conectando ao RabbitMQ...');
        const rabbitMQService = await RabbitMQService.getInstance();
        
        console.log('Inscrito na fila "report". Aguardando mensagens...');
        await rabbitMQService.consume('report', processMessage);
    } catch (error) {
        console.error('Erro no serviço de relatório:', error);
        // Reconecta após 5 segundos em caso de erro
        setTimeout(consume, 5000);
    }
}

// Inicia o serviço
consume();

// Trata encerramento gracioso
process.on('SIGINT', () => {
    console.log('\nEncerrando serviço de relatório...');
    process.exit(0);
});