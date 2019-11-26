
import { Component, OnInit } from '@angular/core';
import { Pesquisador } from '../../../../common/pesquisador';
import { PesquisadorService } from './pesquisador.service';

@Component({
  selector: 'app-root',
  templateUrl: './pesquisadores.component.html',
  styleUrls: ['./pesquisadores.component.css']
})
export class PesquisadoresComponent implements OnInit {

  // IMPORTANT: Only server will create pesquisador when uploading lattes
  // pesq: Pesquisador = new Pesquisador();
  // pesquisadores: Pesquisador[] = [];

  // variable to alert if an error occoured during the processing of a lattes file
  errorLattes: boolean = false;

  constructor(private pesquisadorService: PesquisadorService) { }

  uploadLattes(files: FileList): void {
    this.pesquisadorService.uploadLattes(files).subscribe(
      (status) => {
        if (!status) {
          this.errorLattes = true;
        }
      },

      // if an error occoured
      msg => {
        alert(msg.message);
      }
    );

  }

  onMove(): void {
    this.errorLattes = false;
  }

  ngOnInit(): void {
    // this.pesquisadorService.getPesquisadores()
    //   .subscribe(
    //     ps => { this.pesquisadores = ps; },
    //     msg => { alert(msg.message); }
    //   );
  }

}