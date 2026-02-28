let logger;
try {
    const winston = require('winston');
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}]: ${message}`;
            })
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: 'logs/app.log' })
        ]
    });
} catch (err) {
    // Fallback simple logger when winston is not installed
    logger = {
        info: (msg) => console.log(new Date().toISOString() + ' [INFO]: ' + msg),
        error: (msg) => console.error(new Date().toISOString() + ' [ERROR]: ' + msg),
        warn: (msg) => console.warn(new Date().toISOString() + ' [WARN]: ' + msg)
    };
}

module.exports = logger;