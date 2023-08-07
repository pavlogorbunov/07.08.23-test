# Тестовое задание на должность "Разработчик NodeJS"
====

Для запуска необходим rabbitMQ

npm i

scripts: 
   * "startm1": `nodemon ./m1.js"` *// запустит M1*
   * "startm2": `nodemon ./m2.js` *// запустит M2*
   * "test": `nodemon ./test.js` *// запустит test - Автоматическая отправка 10-ти запросов К М1*
   * "test+": `@start node ./m1.js & @start node ./m2.js & @start node ./m2.js & @start node ./test.js` *// одновременно запустит один процесс M1, два процесса М2 и один test.js в разных окнах*