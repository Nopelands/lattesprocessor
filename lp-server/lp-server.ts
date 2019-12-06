import express = require('express');
import bodyParser = require("body-parser");

const multer = require('multer');
const upload = multer({ dest: './uploads' });

const fs = require('fs');

import { QualisFactory } from './qualisfactory';
import { Qualis } from '../common/qualis';
// add imports here

var lpserver = express();

// add services here

let qualisFactory : QualisFactory = new QualisFactory();
let qualisService : Qualis = new Qualis();

var allowCrossDomain = function(req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

lpserver.use(allowCrossDomain);

lpserver.use(bodyParser.json());

// add reqs here

lpserver.post('/qualis/adicionar', upload.single('qualisFile'), (req: express.Request, res: express.Response) => {
    let fileEnconding : string = fs.readFileSync(req.file.path, 'binary');
    qualisFactory.readXls(fileEnconding);
    qualisFactory.makeQualis();
    qualisService.copyFrom(qualisFactory.getQualis());
    if (qualisService.getQualis()) {
        res.send({"success" : "planilha cadastrada com sucesso"});
    } else res.send({"failure" : "planilha nao foi cadastrada"});
})

lpserver.get('/qualis', (req: express.Request, res: express.Response) => {
  res.send(JSON.stringify(Array.from(qualisService.getQualis())));
})

lpserver.get('/qualis/avaliacao', (req: express.Request, res: express.Response) => {
  let periodico : string = req.params.periodico;  
  if (qualisService.assertKey(periodico)) {
    res.send({"success" : qualisService.getAvaliacao(periodico)});
  } else res.send({"failure" : "periodico nao possui avaliacao"});
})

var server = lpserver.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function closeServer(): void {
  server.close();
}

export { server, closeServer }