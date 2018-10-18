import { Component, OnInit, HostBinding, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnChanges {
  @HostBinding('class.content-container') contentContainer = true;
  @Input() link;

  collapsed = false;
  menuItems;

  constructor(private _router: Router) {
  }

  ngOnInit() {

  }

  ngOnChanges() {

    this.menuItems = [
      {
        caption: 'Activity summary',
        link: './package_dashboard/summary/' + this.link
      },
      {
        caption: 'Today\'s data',
        link: './package_dashboard/table/' + this.link
      },
      {
        caption: 'Historical data',
        link: './package_dashboard/history/' + this.link
      }
    ];
    // if (this.link === 'Prerate') {
    //   this.menuItems.splice(1, 0, {
    //     caption: 'Today\'s data',
    //     link: './table/' + this.link
    //   });
    // }
    this._router.navigate(['package_dashboard/summary', this.link]);
  }
}
