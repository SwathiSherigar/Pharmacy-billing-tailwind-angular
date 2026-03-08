import { Component, HostListener } from '@angular/core';
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
  collapsed = window.innerWidth <= 768;

  toggle() {
    this.collapsed = !this.collapsed;
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth <= 768) {
      this.collapsed = true;
    }
  }
}
