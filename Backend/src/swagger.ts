const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Histórico API',
      version: '1.0.0',
      description: 'API para manipulação de históricos de pontos e transações',
    },
  },
  apis: ['./src/router/historico.ts'], 
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
