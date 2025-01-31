import express = require('express');
import bodyParser = require("body-parser");

const multer = require('multer');
const upload = multer({ dest: './uploads' });

const fs = require('fs');

import { QualisFactory } from './qualisfactory';
import { Qualis } from '../common/qualis';
import { CadastroDePesquisadores } from './cadastrodepesquisadores';
import { LattesFactory } from './lattesFactory';
import { Pesquisador } from '../common/pesquisador';

var lpserver = express();
let cadatroPesq = new CadastroDePesquisadores();
let cvDiffResult: string = "";
let authorDiffResult: string = "";
const lattesFactory = new LattesFactory(cadatroPesq);

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

// ========== REQUESTS ==========

// add reqs here

lpserver.post('/qualis/adicionar', upload.single('qualisFile'), (req: express.Request, res: express.Response) => {
    let fileEnconding : string = fs.readFileSync(req.file.path, 'binary');
    qualisFactory = new QualisFactory();
    qualisFactory.readXls(fileEnconding);
    if (qualisFactory.fileContent) {
      qualisFactory.makeQualis();
      qualisService.copyFrom(qualisFactory.getQualis());
      if (qualisService.getQualis().size > 0) {
          res.send({"success" : "planilha cadastrada com sucesso"});
      } else res.send({"failure" : "nenhuma entrada adicionada"});
    } else res.send({"failure" : "planilha com formatacao invalida"});
})

lpserver.delete('/qualis/apagar', (req: express.Request, res: express.Response) => {
  qualisService = new Qualis();
  if (qualisService.getQualis().size == 0) {
    res.send({"success" : "Tabela qualis apagada"});
  } else res.send({"failure" : "Erro ao apagar a tabela"});
})

lpserver.get('/qualis', (req: express.Request, res: express.Response) => {
  res.send(JSON.stringify(Array.from(qualisService.getQualis())));
})

lpserver.post('/qualis/avaliacao', (req: express.Request, res: express.Response) => {
  let periodico : string = req.body.periodico;
  if (qualisService.assertKey(periodico)) {
    res.send({"success" : qualisService.getAvaliacao(periodico)});
  } else res.send({"failure" : "periodico nao possui avaliacao"});
})
lpserver.post('/pesquisador/adicionar', upload.array('lattesFiles', 12), (req: express.Request, res: express.Response) => {
  let error = false;

  for(let i = 0; i < req.files.length; i++) {
    let xml_string = fs.readFileSync(req.files[i].path, 'binary');
    let p =  lattesFactory.importLattes(xml_string);

    if(p === null) {
      error = true;
    }
  }

  if(!error) {
    cvDiffResult = lattesFactory.cvDiff;
    authorDiffResult = lattesFactory.authorDiff;
    res.send({
      success: 'arquivos foram importados com sucesso',
    })

    return;
  }

  res.send({
    failure: 'houve um erro ao importar os arquivos',
  })

});

lpserver.get('/pesquisadores/', (req: express.Request, res: express.Response) => {
  res.send(JSON.stringify(cadatroPesq.getPesquisadores()));
});

lpserver.get('/cvdiff/', (req: express.Request, res: express.Response) => {
    res.send(JSON.stringify(cvDiffResult));
});

lpserver.get('/authordiff/', (req: express.Request, res: express.Response) => {
    res.send(JSON.stringify(authorDiffResult));
});

lpserver.get('/estudos-comparativos/', (req: express.Request, res: express.Response) => {
  let pesquisadores: Pesquisador[] = cadatroPesq.getPesquisadores();

  let queryPartial = req.query.pesos;
  
  console.log(queryPartial);

  if (!queryPartial){
    res.send('[]')
    return;
  }

  queryPartial = queryPartial.split(',');
  
  queryPartial.forEach((element:string, i:any) => {
    queryPartial[i] = parseInt(element);
  });

  let pesos: number[] = queryPartial;
  let ranking: any = [];

  pesquisadores.forEach((pesq: any) => {
    let sumPont = 0;
    pesq.publicacoes.forEach((publi: any) => {
      let currentPont = 0;
      let nota = qualisService.getAvaliacao(publi.periodico);

      if (nota == 'A1'){
        currentPont = pesos[0];
      } else if (nota == 'A2') {
        currentPont = pesos[1];
      } else if (nota == 'B1') {
        currentPont = pesos[2];
      } else if (nota == 'B2') {
        currentPont = pesos[3];
      } else if (nota == 'B3') {
        currentPont = pesos[4];
      } else if (nota == 'B4') {
        currentPont = pesos[5];
      } else if (nota == 'B5') {
        currentPont = pesos[6];
      } else if (nota == 'C') {
        currentPont = pesos[7];
      } else {
        currentPont = 0;
      }
      sumPont += currentPont;
    });
    
    ranking.push({
        pesquisador: pesq,
        pontos: sumPont,
    })

  });

  ranking.sort((a: any, b: any) => {
    if(a.pontos > b.pontos) {
      return -1;
    } else if(b.pontos > a.pontos) {
      return 1;
    }

    // equal pontos
    if(a.pesquisador.name > b.pesquisador.name) {
      return 1;
    } else if(b.pesquisador.name > a.pesquisador.name) {
      return -1
    }

    return 0;

  })

  res.send(ranking)
})

var server = lpserver.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function closeServer(): void {
  server.close();
}

export { server, closeServer }
