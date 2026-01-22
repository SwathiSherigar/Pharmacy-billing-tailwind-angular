import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from "@angular/material/icon";
import { NgClass } from '@angular/common';


@Component({
  selector: 'topbar',
   imports: [MatToolbar, MatIconModule,NgClass],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  @Input() isCollapsed = false;
   @Output() toggle = new EventEmitter<void>();
}
