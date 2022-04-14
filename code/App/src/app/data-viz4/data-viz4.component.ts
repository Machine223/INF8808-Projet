import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { strings } from '@material/select';
import * as d3 from 'd3';
import { select, stratify } from 'd3';
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

var PLAYER_ID = 0

let LEGEND_MAP = new Map<string, string>([
  ["GK_legend", "Gardien de but:"],
  ["DF_legend", "Défenseur:"],
  ["FW_legend", "Attaquant:"],
  ["MF_legend", "Milieu de terrain:"],
]);

let COLOR_MAP  = new Map<string, string>([
  ["GK", "green"],
  ["DF", "blue"],
  ["FW", "red"],
  ["MF", "orange"],
]);
// id in data structure -> id in map
let PLAYERID_MAP = new Map<number,number>([

])



@Component({
  selector: 'app-data-viz4',
  templateUrl: './data-viz4.component.html',
  styleUrls: ['./data-viz4.component.css']
})
export class DataViz4Component implements OnInit {

  private data: any[] = []
  //all player
  private playerByPosition: PlayerByPosition = {GK:[],FW:[],MF:[],DF:[]}
  private playerMainPosition:PlayerByPosition = {GK:[],FW:[],MF:[],DF:[]}
  //This will store player on field.
  private onFieldPlayer: PlayerByPosition = {GK:[],FW:[],MF:[],DF:[]}
  //We use these fields for Pie Chart:
  private teamValue: TotalValue = {GK:0,FW:0,MF:0,DF:0,total:0} 
  private onFieldValue: TotalValue ={GK:0,FW:0,MF:0,DF:0,total:0}


  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_viz4.json')
      .then((data: any) => {
        console.log("Init")
        this.data = data;
        
        this.playerByPositionMapping()
      }).then(() =>{
        this.createBaseTemplate()
        this.createSVGPlayerOnField()

      })
  }

  // Fill the player map to enumerate player by position later on.
  private playerByPositionMapping(){
    console.log(this.data)
    this.data.forEach(player => {
      this.addPlayerInit(player);

    })
    console.log("onfield:",this.onFieldValue)
    console.log("")
  }
  
  //Add player name to the right array
  private addPlayerInit(playerInfo: any) {
    

    let pos: string[] = playerInfo.Pos.split(",",2)
    let player:Player = {Name:playerInfo.Player, Img:playerInfo.Img ,Pos:pos,Age:playerInfo.Age,salary:playerInfo.salary,OnField: false}
    
    for(let i= 0; i < pos.length;i++) {
      try{
        switch (pos[i]) {
          case "GK":
            //Todo: Verifier si la reference du joueur change lorsqu'on ajoute sur le terrain
            //We suppose that the first position is the main player position
            if(i == 0){
              this.teamValue.GK += player.salary
              this.playerMainPosition.GK.push(player)
            }
            this.playerByPosition.GK.push(player)
            break;
          case "MF":
            if(i == 0){
              this.teamValue.MF += player.salary
              this.playerMainPosition.MF.push(player)
            }
            this.playerByPosition.MF.push(player)
            break
          case "FW":
            if(i == 0){
              this.teamValue.FW += player.salary
              this.playerMainPosition.FW.push(player)
            }
            this.playerByPosition.FW.push(player)

            break
          case "DF":
            if(i == 0){
              this.teamValue.DF += player.salary
              this.playerMainPosition.DF.push(player)
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
      cur_GK +=1
      this.onFieldPlayer.GK.push(player)
      this.onFieldValue.GK += player.salary
      this.onFieldValue.total += player.salary

    }
    //Front wing
    else if (player.Pos[0] == "FW" && cur_FW < MAX_FW) {
      player.OnField = true
      cur_FW+=1
      this.onFieldPlayer.FW.push(player)
      this.onFieldValue.FW += player.salary
      this.onFieldValue.total += player.salary


      //defense
    } else if (player.Pos[0] == "DF" && cur_DF < MAX_DF){
      cur_DF+=1
      player.OnField = true
      this.onFieldPlayer.DF.push(player)
      this.onFieldValue.DF += player.salary
      this.onFieldValue.total += player.salary

      //MidField
    } else if  (player.Pos[0] == "MF" && cur_MF < MAX_MF){
        cur_MF+=1
        player.OnField = true
        this.onFieldPlayer.MF.push(player)
        this.onFieldValue.MF += player.salary
        this.onFieldValue.total += player.salary

    }

  }

  //Switch player onField with another one update onfieldValue
  private substitutePlayer(){
    const pass = 'pass';  

    //update salary

    //update d3


  }

  //add d3 logic here:


  private createBaseTemplate() {
    console.log("Base template")

    //Add football field with predetermine size:
    let playerLegendIdList:string[]= ["GK_legend","MF_legend","FW_legend","DF_legend"]
    
    playerLegendIdList.forEach(id => this.createSVGLegend(id))


    

    var svg_GK_legend = d3.select("div.GK_legend")
    .append("svg")
    .attr("id","GK_legend_id")
    .attr("width", 960)
    console.log(svg_GK_legend)


    d3.selectAll("div.MF_legend").append("svg")
    d3.selectAll("div.DF_legend").append("svg")
    d3.selectAll("div.FW_legend").append("svg")
 
    //With hover


    //Create D3 pie chart


  }

  private drawCircle() {
    const pass = 'pass';  

  }

  //Create SVG player legend:
  // Create 4 svg div with attribute
  private createSVGLegend(id:string) {
    console.log(id.split(" ",1)[0])
    let svgSectionTitle = LEGEND_MAP.get(id) as string
    var parentDiv:any = document.getElementById(id);
    //Create SVG
    var svg = d3.select(parentDiv).append("svg").attr("width", parentDiv.clientWidth)
    .attr("id",id+"_svg").attr("height", parentDiv.clientHeight)
    //
    let defs = svg.append("defs").append("clipPath").attr("id",id+"_circle")

    let g_wrapper= svg.append("g").attr("width", parentDiv.clientWidth)
    .attr("id",id+"_g")


    svg.append("text").
    attr("x",0).attr("y",10)
    .attr("text-anchor","start").attr("style","font-size:9;").attr("font-weight", "bold")
    .text(svgSectionTitle)
    
    

    let currentPos  = id.split("_",1)[0] as keyof PlayerByPosition
    let playerList = this.getProperty(this.playerMainPosition,currentPos) as any[]
    this.createPlayerCircle(playerList,svg,g_wrapper,defs,currentPos)
    playerList.forEach(player => { 
      console.log(player.Player)
    });
  }

  public getProperty<O, key extends keyof O>(o:O , propertyName: key) : O[key] {
    return o[propertyName]; // o[propertyName] is of type T[K]
  }

  private createPlayerCircle(players:any[],svg:d3.Selection<any, unknown, null, undefined>,g_wrapper:d3.Selection<any, unknown, null, undefined>,defs:d3.Selection<any, unknown, null, undefined>,currentPos:string){
    let self = this;
    let x = 35
    let y = 35
    let r= 20
    let color = COLOR_MAP.get(currentPos) as string
    let current_svg_width = Number(svg.attr("width"))
    console.log("createPlayerCircle")
    
    for(let i =0; i < players.length; i++) {
      let circle_tag = g_wrapper.attr("id")+PLAYER_ID
      let player_name = players[i].Name.split(" ", 2)
      let firstname= player_name[0]
      let lastname = player_name[1]
      //Adding circle
      if (x+r*2 > current_svg_width) {
        x= 30
        y +=60
      }

      defs.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", r)
      .attr("class","shadow")
      .attr("id",circle_tag)
      
      g_wrapper.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", r+1)
      .attr("class","shadow")
      .attr("stroke",color)
      .attr("fill",color)
      .attr("id",circle_tag)

      g_wrapper.append("text").
      attr("x",x).attr("y",y+r+7)
      .attr("text-anchor","middle").attr("style","font-size:9;").attr("font-weight", "bold")
      .text(firstname)
      g_wrapper.append("text").
      attr("x",x).attr("y",y+r+15)
      .attr("text-anchor","middle").attr("style","font-size:9;").attr("font-weight", "bold")
      .text(lastname)
  
  
      g_wrapper.append("image")
      .attr('xlink:href', players[i].Img)
      .attr("clip-path",`url(#${defs.attr("id")})`)
      .attr("width",40)
      .attr("heigth",40)
      .attr("x",x-r)
      .attr("id","i"+PLAYER_ID)
      .attr("y",y-r)

      
  
      PLAYER_ID++

      x += 60
    }
    svg.attr("height",g_wrapper.node().getBBox().height+15)
  }

  public clickNewPlayer(event:any,d:any) {
    // console.log("click new player")
    let elem = (document.elementFromPoint(event.x,event.y) as HTMLElement);
    let elemid = elem.id
    let parentid = (elem.parentNode as HTMLElement).id
    // console.log(parentid+elemid) combining id to get circle id doesn't work yet.

    // console.log(elem)
    let elem1= d3.select("i"+elemid).attr("style","filter: grayscale(100%);")
    // console.log(elem1)

  }

  createSVGPlayerOnField() 
  {
    let id= "field"

    console.log("createSVGPlayerOnField")
    let pos_property = ["GK","FW","DF","MF"]
    console.log(this.onFieldPlayer)
    // Create svg here
    var fieldDiv:any = document.getElementById("field");
    console.log(fieldDiv)
    //Create SVG
    var svg = d3.select(fieldDiv).append("svg")
    .attr("width", fieldDiv.width)
    .attr("height",fieldDiv.clientHeight)
    .attr("id",id+"_svg").attr("height", fieldDiv.clientHeight)
    .attr("class","img-overlay-wrap")
    //
    let defs = svg.append("defs").append("clipPath").attr("id",id+"_circle")

    let g_wrapper= svg.append("g").attr("width", fieldDiv.clientWidth)
    .attr("id",id+"_g")

    pos_property.forEach(position => {
        let playerList = this.getProperty(this.playerMainPosition,position as keyof PlayerByPosition) as any[]
        // this.createPlayerCircle(playerList,svg,g_wrapper,defs,position)
        console.log("playerList:",playerList)

    })
    
  }

}
