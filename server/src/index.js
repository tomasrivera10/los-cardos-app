import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { poolPromise } from './db.js';
import sql from 'mssql';
import serverless from 'serverless-http';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    req.context = { db: await poolPromise };
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/obtener-cliente/:dni', async (req, res) => {
  const documento = req.params.dni;
  if (!documento) {
    return res.status(400).json({ success: false, error: 'Falta el parámetro documento' });
  }

  const query = `
    SELECT E.Descripcion, NumeroDocumento, IdCliente, RazonSocial, CC.Descripcion 
    FROM Clientes C
    INNER JOIN EstadosClienteProveedor E ON C.IDEstado = E.IDestado
    INNER JOIN CategoriaCliente CC ON C.IdCategoria = CC.IDCategoriaCliente
    WHERE NumeroDocumento = @documento
  `;

  try {
    const result = await req.context.db.request()
      .input('documento', sql.VarChar, documento)
      .query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a global error handler to catch unhandled errors
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, error: error.message });
});

// Export the handler as the default export
const handler = serverless(app);
export default handler;