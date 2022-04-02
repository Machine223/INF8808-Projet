import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import {PlayerByPosition,Player,TotalValue} from "./viz4_interface";

const MAX_GK =1
const MAX_DF =2
const MAX_MF =5
const MAX_FW =3
// Current count
var cur_GK =0
var cur_DF =0
var cur_MF =0
var cur_FW =0

@Component({
  selector: 'app-data-viz4',
  templateUrl: './data-viz4.component.html',
  styleUrls: ['./data-viz4.component.css']
})
export class DataViz4Component implements OnInit {

  private data: any[] = []
  private playerByPosition: PlayerByPosition = {GK:[],FW:[],MF:[],DF:[]}
  //This will store player on field.
  private onFieldPlayer: PlayerByPosition = {GK:[],FW:[],MF:[],DF:[]}
  //We use these fields for Pie Chart:
  private teamValue: TotalValue = {GK:0,FW:0,MF:0,DF:0,total:0} 
  private onFieldValue: TotalValue ={GK:0,FW:0,MF:0,DF:0,total:0}


  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_viz4.json')
      .then((data: any) => {
        this.data = data;
        this.playerByPositionMapping()
      }).then(() =>{
        this.createBaseTemplate()
      })
  }

  // Fill the player map to enumerate player by position later on.
  private playerByPositionMapping(){
    this.data.forEach(player => {
      this.addPlayerInit(player);      
    })
  }
  
  //Add player name to the right array
  private addPlayerInit(playerInfo: any) {
    let pos: string[] = playerInfo.pos.split(",")
    let player:Player = {Name:playerInfo.Player, Img:playerInfo.Img ,Pos:pos,Age:playerInfo.Age,salary:playerInfo.salary,OnField: false}
    for(let i= 0; i < pos.length;i++) {
      try{
        switch (pos[i]) {
          case "GK":
            //Todo: Verifier si la reference du joueur change lorsqu'on ajoute sur le terrain
            //We suppose that the first position is the main player position
            if(i == 0){
              this.teamValue.GK += player.salary
            }
            this.playerByPosition.GK.push(player)
            break;
          case "MF":
            if(i == 0){
              this.teamValue.MF += player.salary
            }
            this.playerByPosition.MF.push(player)
            break
          case "FW":
            if(i == 0){
              this.teamValue.FW += player.salary
            }
            this.playerByPosition.FW.push(player)

            break
          case "DF":
            if(i == 0){
              this.teamValue.DF += player.salary
            }
            this.playerByPosition.DF.push(player)
            break
          default:
            throw new Error("Unexpected value, verify data integrity");

        }
      } catch(e) {
        console.error(e)
      }
    }
    this.teamValue.total += player.salary
    this.addPlayerOnFieldInit(player)
  }
  //Adding default player on the field only considering [0]
  private addPlayerOnFieldInit(player:Player): void {

    //Adding Goaler
    if (player.Pos[0] == "GK" && cur_GK < MAX_GK){
      player.OnField = true
      this.onFieldPlayer.GK.push(player)
      this.onFieldValue.GK += player.salary
    }
    //Front wing
    else if (player.Pos[0] == "FW" && cur_FW < MAX_FW) {
      player.OnField = true
      this.onFieldPlayer.FW.push(player)
      this.onFieldValue.FW += player.salary

      //defense
    } else if (player.Pos[0] == "DF" && cur_DF < MAX_DF){
      player.OnField = true
      this.onFieldPlayer.DF.push(player)
      this.onFieldValue.DF += player.salary
      //MidField
    } else if  (player.Pos[0] == "MF" && cur_DF < MAX_DF){
        player.OnField = true
        this.onFieldPlayer.MF.push(player)
        this.onFieldValue.MF += player.salary
    }

    this.onFieldValue.total += player.salary
  }

  //Switch player onField with another one update onfieldValue
  private substitutePlayer(){
    const pass = 'pass';  

    //update salary

    //update d3


  }

  //add d3 logic here:


  private createBaseTemplate() {
    const pass = 'pass'

    //Add football field with predetermine size:


    //Add Title


    // Add legend


    //Create legend SVG 


    //Player svg images

    //Create field player svg

    //With hover


    //Create D3 pie chart


  }


}
