import { Component, Input, OnInit } from '@angular/core';
import { Stat } from 'src/assets/stat';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  standalone: true
})
export class WritePromptComponent implements OnInit {
  @Input() gameState: string = "";
  prompt: string = "";
  optionOne: Stat = this.randomStat();
  optionTwo: Stat = this.randomStat();

  constructor() {}

  ngOnInit() {
  }

  setPrompt(promptEvent: any) {
    this.prompt = promptEvent.target.value;
    console.log(this.prompt);
  }

  randomStat() {
    const values = Object.keys(Stat) as Array<keyof typeof Stat>;  
    const enumKey = values[Math.floor(Math.random() * values.length)];
    return Stat[enumKey];
  }
}
