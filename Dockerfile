FROM node:14.16.1-alpine3.10 AS base
WORKDIR /var/www/

# Etapa para instalar dependências compartilhadas
FROM base AS dependencies
COPY package*.json ./
RUN npm install amqplib dotenv --save

FROM base AS contact-service
COPY --from=dependencies /var/www/node_modules ./node_modules
ADD services/contact/ .
RUN npm install nodemailer dotenv amqplib --save
CMD ["node", "app.js"]

FROM base AS order-service
COPY --from=dependencies /var/www/node_modules ./node_modules
ADD services/order/ .
CMD ["node", "app.js"]

FROM base AS shipping-service
COPY --from=dependencies /var/www/node_modules ./node_modules
ADD services/shipping/ .
CMD ["node", "app.js"]

FROM base AS report-service
COPY --from=dependencies /var/www/node_modules ./node_modules
ADD services/report/ .
CMD ["node", "app.js"]