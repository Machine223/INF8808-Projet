import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { strings } from '@material/select';
import * as d3 from 'd3';
import { select, stratify } from 'd3';
import {PlayerByPosition,Player,TotalValue, PieData} from "./viz4_interface";

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
  private isOnField: boolean[] = []


  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_viz4.json')
      .then((data: any) => {
        console.log("Init")
        this.data = data;
        
        this.playerByPositionMapping()
      }).then(() =>{
        this.outerEdge()
        this.createBaseTemplate()
        this.createSVGPlayerOnField()
        this.createSalaryScale()
        this.greyPlayerOnField()
        this.pieInit()

      })
      console.log("onfield,",this.onFieldPlayer)
  }

  // Fill the player map to enumerate player by position later on.
  private playerByPositionMapping(){
    let i = 0
    //creating data structure
    this.data.forEach(player => {
      player.id = i
      this.isOnField.push(false)
      i++
    })
    this.data.forEach(player => {
      this.addPlayerInit(player);
    })
    console.log("onfield:",this.onFieldValue)
  }
  
  //Add player name to the right array
  private addPlayerInit(playerInfo: any) {
    

    let pos: string[] = playerInfo.Pos.split(",",2)
    let player:Player = {Name:playerInfo.Player, Img:playerInfo.Img ,Pos:pos,Age:playerInfo.Age,salary:playerInfo.salary,OnField: false,id:playerInfo.id}
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
    let i:number = player.id
    if (!this.isOnField[i]) {
      if (player.Pos[0] == "GK" && cur_GK < MAX_GK){
        this.isOnField[i] = true

        player.OnField = true
        cur_GK +=1
        this.onFieldPlayer.GK.push(player)
        this.onFieldValue.GK += player.salary
        this.onFieldValue.total += player.salary

      }
      //Front wing
      else if (player.Pos[0] == "FW" && cur_FW < MAX_FW) {
        player.OnField = true
        this.isOnField[i] = true

        cur_FW+=1
        this.onFieldPlayer.FW.push(player)
        this.onFieldValue.FW += player.salary
        this.onFieldValue.total += player.salary


        //defense
      } else if (player.Pos[0] == "DF" && cur_DF < MAX_DF){
        
        cur_DF+=1
        player.OnField = true
        this.isOnField[i] = true

        this.onFieldPlayer.DF.push(player)
        this.onFieldValue.DF += player.salary
        this.onFieldValue.total += player.salary

        //MidField
      } else if  (player.Pos[0] == "MF" && cur_MF < MAX_MF){
          cur_MF+=1
          this.isOnField[i] = true
          player.OnField = true
          this.onFieldPlayer.MF.push(player)
          this.onFieldValue.MF += player.salary
          this.onFieldValue.total += player.salary

      }
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

    //Add football field with predetermine size:
    let playerLegendIdList:string[]= ["GK_legend","MF_legend","FW_legend","DF_legend"]
    
    playerLegendIdList.forEach(id => this.createSVGLegend(id))


    

    var svg_GK_legend = d3.select("div.GK_legend")
    .append("svg")
    .attr("id","GK_legend_id")
    .attr("width", 960)


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
      PLAYER_ID = players[i].id
      let circle_tag = g_wrapper.attr("id")+PLAYER_ID
      let player_name = players[i].Name.split(" ", 2)
      let firstname= player_name[0]
      let lastname = player_name[1]
      //Adding circle
      if (x+r*2 > current_svg_width) {
        x= 35
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

      //.style("filter","grayscale(100)")
  

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

    let pos_property = ["GK","FW","DF","MF"]
    // Create svg here
    var fieldDiv:any = document.getElementById("field");
    //Create SVG
    var svg = d3.select(fieldDiv).append("svg")
    .attr("height",818)
    .attr("id",id+"_svg").attr("width", 516)
    svg.style("position","absolute")
    .style("left","0px")
    .style("top","0px")
    //
    let defs = svg.append("defs").append("clipPath").attr("id",id+"_circle")
    pos_property.forEach(position => {
        let playerList = this.getProperty(this.playerMainPosition,position as keyof PlayerByPosition) as any[]
        this.createPlayerFieldCircle(playerList,svg,defs,position)

    })
    
  }
  private createPlayerFieldCircle(players:any[],svg:d3.Selection<any, unknown, null, undefined>,defs:d3.Selection<any, unknown, null, undefined>,currentPos:string){
    
    let g_wrapper = svg.append("g").attr("id","field"+currentPos)

    let self = this;
    let x = 270
    let y = 35
    let r= 20
    let r2 =20
    let color = COLOR_MAP.get(currentPos) as string
    
    for(let i =0; i < players.length; i++) {
      let circle_tag = g_wrapper.attr("id")+i
      let player_name = players[i].Name.split(" ", 2)
      let firstname= player_name[0]
      let lastname = player_name[1]
      if (players[i].salary > 10000000){
        r2 = 55
      } else if (players[i].salary > 1000000) {
        r2= 30
      } else {
        r2 = 5 
      }
      //Adding circle with absolute position
      if(currentPos == "GK"){
        x = 300
        y = 100
        
      } else if (currentPos == "DF") {
        if ( i == 0 ){
          x = 130
          y = 90
        } else if (i==1) {
          x = 400
          y = 200
        }
        if (i>=cur_DF){
          break;
        }
      } else if(currentPos == "MF") {
        switch (i) {
          case 0:
            x=125
            y=325
            break;
          case 1:
            x=125
            y=470
            break;
          case 2:
            x=270
            y=400
            break;
          case 3:
            x=430
            y=470
            break
          case 4:
            x=430
            y=325
            break;

          default:
            break;
        } 
        if (i>=MAX_MF){
          break;
        }
        } else if (currentPos == "FW"){
          switch (i) {
            case 0:
              x=125
              y=650
              break;
            case 1:
              x=430
              y=650
              break;
            case 2:
              x=270
              y=600
              break;
          }
          if (i>=MAX_FW){
            break;
          }

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

        g_wrapper.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", r2+40)
        .attr("class","shadow")
        .attr("stroke",color)
        .attr("fill",color)
        .attr("id","e_"+circle_tag)
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
  }
  //Create the scaler
  private createSalaryScale(){

    // Create svg here
    var fieldDiv:any = document.getElementById("salaryScale");
    //Create SVG
    var svg = d3.select(fieldDiv).append("svg")
    .attr("width",380).attr("height",225)
    .attr("id","scale")
    svg.append("circle")
    .attr("cx","50%")
    .attr("cy","50%")
    .attr("r",20)
    .attr("stroke","black").attr("stroke-width",3)
    .attr("fill","none")
    .attr("stroke-dasharray","5,5")
    .style("")

    svg.append("text").
    attr("x",190).attr("y",150)
    .attr("text-anchor","middle").attr("style","font-size:12;").attr("font-weight", "bold")
    .text("<1M")
    svg.append("text").
    attr("x",190).attr("y",175)
    .attr("text-anchor","middle").attr("style","font-size:12;").attr("font-weight", "bold")
    .text("1-10M")
    svg.append("text").
    attr("x",190).attr("y",200)
    .attr("text-anchor","middle").attr("style","font-size:12;").attr("font-weight", "bold")
    .text(">10M")

    svg.append("circle")
    .attr("cx","50%")
    .attr("cy","50%")
    .attr("r",95)
    .attr("stroke","black").attr("stroke-width",3)
    .attr("fill","none")
    .style("")

    svg.append("circle")
    .attr("cx","50%")
    .attr("cy","50%")
    .attr("r",45)
    .attr("stroke","black").attr("stroke-width",3)
    .attr("fill","none")
    .style("")

    svg.append("circle")
    .attr("cx","50%")
    .attr("cy","50%")
    .attr("r",70)
    .attr("stroke","black").attr("stroke-width",3)
    .attr("fill","none")
    .style("")
    svg.append("text").
    attr("x",0).attr("y",12)
    .attr("text-anchor","start").attr("style","font-size:15;").attr("font-weight", "bold")
    .text("Légende:")

  }
  //Make the outerEdge of the rectangle
  private outerEdge() {
    var fieldDiv:any = document.getElementById("start");
    d3.select(fieldDiv).append("svg")
    .attr("id","curved_rec")
    .attr("width",1000)
    .attr("height",1000)
    .append("rect")
    .attr("stroke","black")
    
  }

  private pieInit(){
    var fieldDiv:any = document.getElementById("pie");
    let width = 450
    let height = 450
    let margin = 40
    var radius = Math.min(width, height) / 2 - margin

    var svg = d3.select("#pie")
    .append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
      
      // Create dummy data

      // set the color scale
      let data:PieData[] = [{position:"Gardien",value: this.teamValue.GK.toString()} 
      , {position:"Défense", value: this.teamValue.DF.toString()},
      {position:"Attaque", value: this.teamValue.FW.toString()},
      {position:"Milieu de terrain", value: this.teamValue.DF.toString()}]
      console.log(data)

      // let pie:PieData[] = d3.pie().sort(null).value(function(d: any){return d.number;}(data))
      // console.log(pie)
      
      // var segments = d3.arc().innerRadius(100).outerRadius(200).padAngle(0.05).padRadius(50)

      // var sections = svg.append("g").attr("transform","translate(250,250)").selectAll("path").data(pie)

  }

  private greyPlayerOnField(){
    console.log(this.data)
    console.log(this.playerMainPosition)
    
  }



}

