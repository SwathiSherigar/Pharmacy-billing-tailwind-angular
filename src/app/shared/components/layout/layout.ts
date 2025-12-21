import { Component } from '@angular/core';
import { Topbar } from "./topbar/topbar/topbar";

@Component({
  selector: 'app-layout',
  imports: [Topbar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

}
