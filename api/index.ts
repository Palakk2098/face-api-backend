// import app from '../src/index';
// import { VercelRequest, VercelResponse } from '@vercel/node';

// // Wrap Express app as a Serverless Function
// export default (req: VercelRequest, res: VercelResponse) => {
//   app(req, res);
// };

export default (req, res) => {
  res.status(200).json({ message: 'Serverless function works!' });
};
