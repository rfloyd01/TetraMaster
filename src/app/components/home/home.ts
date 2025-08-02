import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardDisplay, CardInfo } from '../../util/card-types';
import { Card } from '../card/card';
import { createDefaultStats } from '../../util/card-util';
import { CommonModule } from '@angular/common';
import { counter } from '../../util/general-utils';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  selectedCards: CardInfo[] = [];
  highlightedCard!: CardInfo;
  allCards: CardInfo[][] = [];

  counter = counter;

  constructor(private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    //For now, generate some random cards to go into the selected
    //cards array
    for (let i: number = 0; i < 5; i++) {
      this.selectedCards.push({
        id: i,
        cardStats: createDefaultStats(),
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      });
    }

    this.highlightedCard = this.selectedCards[0];
  }

  startNewGame() {
    this.router.navigate(['/game']);
  }

}
