import { Component } from '@angular/core';
import { Topbar } from "./topbar/topbar";
import { SidebarComponent } from "./sidebar/sidebar";
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from "@angular/material/sidenav";
import { RouterOutlet } from "@angular/router";
import { NgClass } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-layout',
  imports: [Topbar, SidebarComponent, MatSidenavContainer, MatSidenav, MatSidenavContent, RouterOutlet, NgClass, SidebarComponent, MatIconModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
collapsed = false;

  toggle() {
    this.collapsed = !this.collapsed;
  }
}
