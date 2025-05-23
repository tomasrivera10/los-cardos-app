import sql from 'mssql';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: 'Nuvix Los Cardos',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Error al conectar a SQL Server:', err);
        throw err;
    });

export { sql, poolPromise };
