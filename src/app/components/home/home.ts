import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    console.log('Home Component initialized');
  }

  startNewGame() {
    this.router.navigate(['/game']);
  }

}
