import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { PlayerByPosition, Player, TotalValue } from './viz4_interface';
//@ts-ignore
import d3Tip from 'd3-tip';

const MAX_GK = 1;
const MAX_DF = 2;
const MAX_MF = 5;
const MAX_FW = 3;

const GREY_FILL = '#D3D3D3';
const GREY_STROKE = '#585858';

//Circle id for unfield player
var CIRCLE_ID = 0;
// Current count
var cur_GK = 0;
var cur_DF = 0;
var cur_MF = 0;
var cur_FW = 0;

let LEGEND_MAP = new Map<string, string>([
  ['GK_legend', 'Gardien de but:'],
  ['DF_legend', 'Défenseur:'],
  ['FW_legend', 'Attaquant:'],
  ['MF_legend', 'Milieu de terrain:'],
]);

let COLOR_MAP = new Map<string, string>([
  ['GK', '#42FF00'],
  ['DF', '#4381B6'],
  ['FW', '#FF0000'],
  ['MF', '#FAD616'],
]);

@Component({
  selector: 'app-data-viz4',
  templateUrl: './data-viz4.component.html',
  styleUrls: ['./data-viz4.component.css'],
})
export class DataViz4Component implements OnInit {
  private data: any[] = [];
  //all player
  private playerByPosition: PlayerByPosition = {
    GK: [],
    FW: [],
    MF: [],
    DF: [],
  };
  private playerMainPosition: PlayerByPosition = {
    GK: [],
    FW: [],
    MF: [],
    DF: [],
  };
  //This will store player on field.
  private playerOnField: PlayerByPosition = { GK: [], FW: [], MF: [], DF: [] };
  //We use these fields for Pie Chart:
  private teamValue: TotalValue[] = [
    { type: 'GK', value: 0 },
    { type: 'DF', value: 0 },
    { type: 'MF', value: 0 },
    { type: 'FW', value: 0 },
  ];
  private onFieldValue: TotalValue[] = [
    { type: 'GK', value: 0 },
    { type: 'DF', value: 0 },
    { type: 'MF', value: 0 },
    { type: 'FW', value: 0 },
  ];
  color = ['#42FF00', '#1C4686', '#FAD616', '#FF0000'];
  totalTeamValue:number | undefined;
  totalOnFieldValue:number | undefined;
  private positionIdMap: Map<number, number> = new Map();
  private isOnField: boolean[] = [];

  private isSelecting: boolean = false;
  //The player currently selected
  private selectedid: number | null = null;

  tip = d3Tip()
    .attr('class', 'd3-tip')
    .html((event: any, d: any) => {
      let elem = document.elementFromPoint(event.x, event.y) as HTMLElement;
      // console.log(elem)
      let playerId = this.positionIdMap.get(
        Number(elem.id.substring(2))
      ) as number;
      // console.log("player id",playerId)
      return `<p class='tooltip-title' style="margin-top: 0px">Joueur : <b>${
        this.data[playerId]['Player']
      }</b></p>\
<div class='tooltip-value'>Position : ${this.data[playerId]['Pos']}</div>\
<div class='tooltip-value'>Salaire : <span id="salary-tooltip">${
        this.data[playerId]['salary'] / 1000000
      }M$</span></div>`;
    });

  constructor() {}

  ngOnInit(): void {
    d3.json('../../assets/data_viz4.json')
      .then((data: any) => {
        // console.log("Init")
        this.data = data;

        this.playerByPositionMapping();
      })
      .then(() => {
        this.outerEdge();
        this.createBaseTemplate();
        this.createSVGPlayerOnField();
        this.createSalaryScale();
        this.listenClick();
        // console.log("team value", this.teamValue)
        // console.log("field value", this.onFieldValue)
        // console.log(this.positionIdMap)
        this.pieInit();
      });
    // console.log("onfield,",this.playerOnField)
  }

  // Fill the player map to enumerate player by position later on.
  private playerByPositionMapping() {
    let i = 0;
    //creating data structure
    this.data.forEach(player => {
      player.id = i;
      this.isOnField.push(false);
      i++;
    });
    this.data.forEach(player => {
      this.addPlayerInit(player);
    });
  }

  private showTip(e: any) {
    let elem = document.elementFromPoint(e.x, e.y) as HTMLElement;
    d3.select(`#${elem.getAttribute('id')}`)
      .attr('stroke-width', 3)
      .attr('stroke', 'black');
  }

  private hideTip() {
    d3.selectAll('.classf_DF').attr('stroke-width', 0);
    d3.selectAll('.classf_GK').attr('stroke-width', 0);
    d3.selectAll('.classf_MF').attr('stroke-width', 0);
    d3.selectAll('.classf_FW').attr('stroke-width', 0);
  }

  private listenClick() {
    let self = this;
    d3.select('#outer').on('click', event => {
      let elem = document.elementFromPoint(event.x, event.y) as HTMLElement;
      if (
        elem.tagName != 'image' &&
        elem.tagName != 'circle' &&
        this.selectedid !== null
      ) {
        this.removeFieldStroke();
        let players = this.matchingPosOnFieldPlayers();
        this.deactivateSwapablePlayers(players);
        this.removeSelectionShadow(this.selectedid as number);
        this.greyingPlayerInLegend(this.selectedid as number);
        this.selectedid = null;
        this.isSelecting = false;
      }
      //Potential bug with svg circle
      var elemClassName = elem.className as any;
      // if (this.isSelecting) {
      if (
        (elem.tagName == 'image' || elem.tagName == 'circle') &&
        elemClassName instanceof SVGAnimatedString
      ) {
        if (
          elemClassName.baseVal.split('_', 1)[0] == 'classf' &&
          this.selectedid != null
        ) {
          var circleid = this.getOnFieldCircleID(elem) as number;

          var playerId = this.positionIdMap.get(circleid) as number;
          // console.log("fieldCircleID",this.data[playerId].Pos.substring(0,2))
          // console.log("selected id positon:",this.data[this.selectedid].Pos.substring(0,2))
          if (
            this.data[playerId].Pos.substring(0, 2) ==
            this.data[this.selectedid].Pos.substring(0, 2)
          ) {
            this.swapPlayers(this.selectedid, circleid);
          }
        }
        // Replace by active player in legend or on the field
      }
    });
  }

  //Add player name to the right array
  private addPlayerInit(playerInfo: any) {
    let pos: string[] = playerInfo.Pos.split(',', 2);
    let player: Player = {
      Name: playerInfo.Player,
      Img: playerInfo.Img,
      Pos: pos,
      Age: playerInfo.Age,
      salary: playerInfo.salary,
      OnField: false,
      id: playerInfo.id,
    };
    for (let i = 0; i < pos.length; i++) {
      try {
        switch (pos[i]) {
          case 'GK':
            //Todo: Verifier si la reference du joueur change lorsqu'on ajoute sur le terrain
            //We suppose that the first position is the main player position
            if (i == 0) {
              this.teamValue[0].value += player.salary;
              this.playerMainPosition.GK.push(player);
            }
            this.playerByPosition.GK.push(player);
            break;
          case 'DF':
            if (i == 0) {
              this.teamValue[1].value += player.salary;
              this.playerMainPosition.DF.push(player);
            }
            this.playerByPosition.DF.push(player);
            break;
          case 'MF':
            if (i == 0) {
              this.teamValue[2].value += player.salary;
              this.playerMainPosition.MF.push(player);
            }
            this.playerByPosition.MF.push(player);
            break;
          case 'FW':
            if (i == 0) {
              this.teamValue[3].value += player.salary;
              this.playerMainPosition.FW.push(player);
            }
            this.playerByPosition.FW.push(player);
            break;

          default:
            throw new Error('Unexpected value, verify data integrity');
        }
      } catch (e) {
        console.error(e);
      }
    }
    // this.teamValue.total += player.salary
    this.addPlayerOnFieldInit(player);
  }
  //Adding default player on the field only considering [0]
  private addPlayerOnFieldInit(player: Player): void {
    //Adding Goaler
    let i: number = player.id;
    if (!this.isOnField[i]) {
      if (player.Pos[0] == 'GK' && cur_GK < MAX_GK) {
        this.isOnField[i] = true;

        player.OnField = true;
        cur_GK += 1;
        this.playerOnField.GK.push(player);
        this.onFieldValue[0].value += player.salary;
        // this.onFieldValue.total += player.salary
      }
      //defense
      else if (player.Pos[0] == 'DF' && cur_DF < MAX_DF) {
        cur_DF += 1;
        player.OnField = true;
        this.isOnField[i] = true;

        this.playerOnField.DF.push(player);
        this.onFieldValue[1].value += player.salary;
        // this.onFieldValue.total += player.salary

        //MidField
      } else if (player.Pos[0] == 'MF' && cur_MF < MAX_MF) {
        cur_MF += 1;
        this.isOnField[i] = true;
        player.OnField = true;
        this.playerOnField.MF.push(player);
        this.onFieldValue[2].value += player.salary;
        // this.onFieldValue.total += player.salary
      }
      //Front Field
      else if (player.Pos[0] == 'FW' && cur_FW < MAX_FW) {
        player.OnField = true;
        this.isOnField[i] = true;

        cur_FW += 1;
        this.playerOnField.FW.push(player);
        this.onFieldValue[3].value += player.salary;
        // this.onFieldValue.total += player.salary
      }
    }
  }

  private createBaseTemplate() {
    //Add football field with predetermine size:
    let playerLegendIdList: string[] = [
      'GK_legend',
      'MF_legend',
      'FW_legend',
      'DF_legend',
    ];

    playerLegendIdList.forEach(id => this.createSVGLegend(id));
  }

  //Create SVG player legend:
  // Create 4 svg div with attribute
  private createSVGLegend(id: string) {
    let svgSectionTitle = LEGEND_MAP.get(id) as string;
    var parentDiv: any = document.getElementById(id);
    //Create SVG
    var svg = d3
      .select(parentDiv)
      .append('svg')
      .attr('width', 400)
      .attr('id', id + '_svg')
      .attr('height', parentDiv.clientHeight);
    //
    svg.call(this.tip);
    let defs = svg
      .append('defs')
      .append('clipPath')
      .attr('id', id + '_circle');

    let g_wrapper = svg
      .append('g')
      .attr('width', parentDiv.clientWidth)
      .attr('id', id + '_g');

    svg
      .append('text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:10;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text(svgSectionTitle);

    let currentPos = id.split('_', 1)[0] as keyof PlayerByPosition;
    let playerList = this.getProperty(
      this.playerMainPosition,
      currentPos
    ) as any[];
    this.createPlayerCircle(playerList, svg, g_wrapper, defs, currentPos);
    playerList.forEach(player => {});
  }

  public getProperty<O, key extends keyof O>(o: O, propertyName: key): O[key] {
    return o[propertyName]; // o[propertyName] is of type T[K]
  }

  private createPlayerCircle(
    players: any[],
    svg: d3.Selection<any, unknown, null, undefined>,
    g_wrapper: d3.Selection<any, unknown, null, undefined>,
    defs: d3.Selection<any, unknown, null, undefined>,
    currentPos: string
  ) {
    let self = this;
    let x = 35;
    let y = 35;
    let r = 20;
    let color = COLOR_MAP.get(currentPos) as string;
    let current_svg_width = Number(svg.attr('width'));
    // console.log("createPlayerCircle")

    for (let i = 0; i < players.length; i++) {
      let playerID = players[i].id;
      let circle_tag = 'cl_' + playerID;
      let player_name = players[i].Name.split(' ', 2);
      let firstname = player_name[0];
      let lastname = player_name[1];
      //Adding circle
      if (x + r * 2 > current_svg_width) {
        x = 35;
        y += 70;
      }

      defs
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r)
        .attr('class', 'shadow')
        .attr('id', circle_tag + '_defs');

      g_wrapper
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r + 1)
        .attr('class', 'shadow')
        .attr('stroke', GREY_STROKE)
        .attr('fill', GREY_FILL)
        .attr('id', circle_tag)
        .style('filter', 'url(#inactive-shadow)');

      g_wrapper
        .append('text')
        .attr('x', x)
        .attr('y', y + r + 12)
        .attr('text-anchor', 'middle')
        .attr('style', 'font-size:9;')
        .attr('font-weight', 'bold')
        .text(firstname);
      g_wrapper
        .append('text')
        .attr('x', x)
        .attr('y', y + r + 22)
        .attr('text-anchor', 'middle')
        .attr('style', 'font-size:9;')
        .attr('font-weight', 'bold')
        .text(lastname);

      let img = g_wrapper
        .append('image')
        .attr('xlink:href', players[i].Img)
        .attr('clip-path', `url(#${defs.attr('id')})`)
        .attr('width', 40)
        .attr('heigth', 40)
        .attr('class', 'swap')
        .style('filter', 'grayscale(1)')
        .attr('x', x - r)
        .attr('id', 'i' + playerID)
        .attr('y', y - r)
        .on('click', datum => {
          // console.log(datum); // the datum for the clicked circle
          // console.log("image clicked")
          self.startingNewPlayerSelection(datum);
        });
      //.style("filter","grayscale(100)")

      x += 60;
    }
    svg.attr('height', g_wrapper.node().getBBox().height + 15);
  }

  //Starting a player selection
  public startingNewPlayerSelection(event: any) {
    let elem = document.elementFromPoint(event.x, event.y) as HTMLElement;
    let id = Number(elem.id.substring(1));

    if (!this.isOnField[Number(elem.id.substring(1))]) {
      this.activatingPlayer(elem);
    } else {
      //We will need to verify if the user select two person from the same position

      //compare positions from data
      if (this.selectedid != null) {
        if (
          this.data[id].Pos.split(',', 2)[0] ==
          this.data[this.selectedid as number].Pos.split(',', 2)[0]
        ) {
          // console.log("both player have the same position")
          let circleID = -1;
          this.positionIdMap.forEach((value, key) => {
            if (value == Number(elem.id.substring(1))) {
              circleID = key;
            }
          });

          this.swapPlayers(this.selectedid as number, circleID);
        }
      }
    }
  }

  private getOnFieldCircleID(elem: HTMLElement) {
    return Number(elem.id.split('_', 2)[1]);
  }
  private swapPlayers(newPlayer: number, circleID: number) {
    let oldPlayerID = this.positionIdMap.get(circleID) as number;
    if (
      this.data[newPlayer].Pos.substring(0, 2) ==
      this.data[oldPlayerID].Pos.substring(0, 2)
    ) {
      // console.log("old player",this.data[oldPlayerID])
      // console.log("new player",this.data[newPlayer])
      // logic for swapping element
      //replacing player image
      let playerdataToReplace = this.data[newPlayer];
      playerdataToReplace.id = newPlayer;
      d3.selectAll('#f_' + circleID).attr('href', this.data[newPlayer].Img);

      this.isOnField[oldPlayerID] = false;
      this.isOnField[newPlayer] = true;
      let newSalary = playerdataToReplace.salary;
      this.positionIdMap.set(circleID, newPlayer);
      let position = this.data[oldPlayerID].Pos.substring(0, 2);
      // console.log(this.playerOnField)
      let playerArray = this.getProperty(this.playerOnField, position);
      // console.log(playerArray)
      let index = 0;
      for (; index < playerArray.length; index++) {
        if (playerArray[index].id == oldPlayerID) {
          break;
        }
      }
      playerArray[index] = playerdataToReplace;
      // console.log(playerArray)
      this.updatePlayerOnFieldArray(playerArray, position);

      this.newRadius(circleID, newSalary);
      //Update salaries

      //deactivating button
      this.greyingPlayerInLegend(oldPlayerID as number);
      let playerOnField = this.matchingPosOnFieldPlayers();
      this.removeSelectionShadow(newPlayer as number);
      this.activateSwapablePlayers(playerOnField);
      this.deactivateSwapablePlayers(playerOnField);
      this.removeFieldStroke();
      // console.log(this.onFieldValue.FW)
      this.selectedid = null;

      this.updatePieChart();
    }
    //update piechart
    //onFieldPlayer pieChart
  }

  private updatePieChart() {
    const width = 900;
    const height = 500;

    const arc = d3
      .arc()
      .innerRadius((0.2 * height) / 2)
      .outerRadius((0.3 * height) / 2);
    const resultsTeamValue: number[] = this.teamValue.map(r => r.value);
    const resultsOnFieldValue: number[] = this.onFieldValue.map(r => r.value);
    this.totalTeamValue = Object.values(resultsTeamValue).reduce(
      (acc, val) => acc + val,
      0
    );
    this.totalOnFieldValue = Object.values(resultsOnFieldValue).reduce(
      (acc, val) => acc + val,
      0
    );

    this.totalTeamValue = +(this.totalTeamValue / 1000000).toFixed(1);
    this.totalOnFieldValue = +(this.totalOnFieldValue / 1000000).toFixed(1);
    console.log(this.totalTeamValue);
    console.log(this.totalOnFieldValue);

    const pieChart = d3
      .pie()
      .startAngle(0 * (Math.PI / 90))
      .endAngle(180 * (Math.PI / 90));
    const data_Field = pieChart(resultsOnFieldValue);
    d3.selectAll('#FieldValuePie').remove();

    const arcs2 = d3
      .select('#FieldSalaryContainer')
      .append('g')
      .attr('id', 'FieldValuePie')
      .attr('class', 'donut')
      .attr('transform', `translate(0, 0)`)
      .selectAll('path')
      .data(data_Field)
      .enter();

    arcs2
      .append('path')
      .attr('class', 'slice')
      .attr('d', <any>arc)
      .attr('fill', (d, i) => this.color[i])
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('opacity', 0.9);

    d3.select('#FieldValuePieNumber').text(this.totalOnFieldValue + ' M$');
  }
  private newRadius(circleID: number, newSalary: number) {
    let r2 = 0;
    if (newSalary > 10000000) {
      r2 = 55;
    } else if (newSalary > 1000000) {
      r2 = 30;
    } else {
      r2 = 5;
    }
    d3.select('#e_' + circleID).attr('r', r2 + 40);
  }

  private updatePlayerOnFieldArray(playerArray: any, position: any) {
    let newSalary = 0;

    switch (position) {
      case 'GK':
        this.playerOnField.GK = playerArray;
        playerArray.forEach((player: any) => {
          newSalary += player.salary;
        });
        this.onFieldValue[0].value = newSalary;
        break;
      case 'DF':
        this.playerOnField.DF = playerArray;
        playerArray.forEach((player: any) => {
          newSalary += player.salary;
        });
        this.onFieldValue[1].value = newSalary;
        break;
      case 'MF':
        this.playerOnField.MF = playerArray;
        playerArray.forEach((player: any) => {
          newSalary += player.salary;
        });
        this.onFieldValue[2].value = newSalary;
        break;
      case 'FW':
        this.playerOnField.FW = playerArray;
        playerArray.forEach((player: any) => {
          newSalary += player.salary;
        });
        this.onFieldValue[3].value = newSalary;
        break;
      default:
        break;
    }
  }

  //Activating player for potential
  private activatingPlayer(elem: HTMLElement) {
    // console.log("first activating palayer",this.selectedid)
    // console.log(elem)
    if (this.selectedid != null) {
      this.greyingPlayerInLegend(this.selectedid as number);
      let playerOnField = this.matchingPosOnFieldPlayers();
      this.removeSelectionShadow(this.selectedid);

      this.activateSwapablePlayers(playerOnField);
      this.deactivateSwapablePlayers(playerOnField);
    }

    let id = Number(elem.id.substring(1));
    this.removeFieldStroke();
    this.selectedid = id;
    // console.log("second activating palayer",this.selectedid)
    this.isSelecting = true;

    this.removeSelectionShadow(this.selectedid);
    this.greyingPlayerInLegend(this.selectedid as number);

    // console.log("nsadifhasfda")

    if (!this.isOnField[id]) {
      let playerOnField = this.matchingPosOnFieldPlayers();
      this.colorPlayerInLegendSelection(Number(elem.id.substring(1) as string));
      //Add effect for player to replace
      this.addStrokePlayerGroup(this.data[id].Pos.split(',', 2)[0]);
      //On field player legend selection

      this.activateSwapablePlayers(playerOnField);
    }
  }
  //If the user want to select another player while in select mode

  //Legend
  private matchingPosOnFieldPlayers() {
    // console.log(this.data[this.selectedid as number])
    //We will only consider the main position for the moment
    let pos: any = this.data[this.selectedid as number].Pos.split(',', 2)[0];
    return this.getProperty(this.playerOnField, pos);
  }

  private greyLegendImageOnly(id: number) {
    d3.select('#i' + id).style('filter', 'grayscale(100)');
  }
  private colorLegendImageOnly(id: number) {
    d3.select('#i' + id).style('filter', 'grayscale(0)');
  }
  private addSelectionShadow(id: number) {
    d3.select('#cl_' + id).style('filter', 'url(#selection-shadow)');
  }
  //setting up different shadows
  private removeSelectionShadow(id: number) {
    if (this.isOnField[id]) {
      // console.log("removeSelectionShadow", id)
      d3.selectAll('#cl_' + id).style('filter', 'url(#active-shadow)');
    } else {
      // console.log("removeSelectionShadow", id)
      d3.selectAll('#cl_' + id).style('filter', 'url(#inactive-shadow)');
    }
  }
  private activateSwapablePlayers(players: Player[]) {
    for (let i = 0; i < players.length; i++) {
      this.colorLegendImageOnly(players[i].id);
      this.addSelectionShadow(players[i].id);
    }
  }

  // grey only the image
  private deactivateSwapablePlayers(players: Player[]) {
    for (let i = 0; i < players.length; i++) {
      // this.greyLegendImageOnly(players[i].id)
      this.removeSelectionShadow(players[i].id);
    }
  }

  //Modifying legend to inactive effect
  private greyingPlayerInLegend(id: number) {
    d3.select('#i' + id)
      .style('filter', 'grayscale(100)')
      .attr('stroke', GREY_STROKE)
      .attr('fill', GREY_FILL);

    d3.select('#cl_' + id)
      .style('stroke', GREY_STROKE)
      .style('filter', 'url(#inactive-shadow)')
      .style('fill', GREY_FILL)
      .style('stroke-width', 1);
  }
  private colorPlayerInLegendSelection(id: number) {
    let pos: string = this.data[id].Pos;
    d3.select('#i' + id).style('filter', 'grayscale(0)');
    // console.log(COLOR_MAP.get(pos.substring(0,2)))
    d3.select('#cl_' + id)
      .style('stroke', COLOR_MAP.get(pos.substring(0, 2)) as string)
      .style('filter', 'url(#active-shadow)')
      .style('fill', COLOR_MAP.get(pos.substring(0, 2)) as string)
      .style('stroke-width', '3');
  }

  private colorPlayerInLegend(id: number) {
    let pos: string = this.data[id].Pos;
    d3.select('#i' + id).style('filter', 'grayscale(0)');
    // console.log(COLOR_MAP.get(pos.substring(0,2)))
    d3.select('#cl_' + id)
      .style('stroke', COLOR_MAP.get(pos.substring(0, 2)) as string)
      .style('filter', 'url(#active-shadow)')
      .style('fill', COLOR_MAP.get(pos.substring(0, 2)) as string);
  }
  private addStrokePlayerGroup(pos: string) {
    // console.log(pos)
    d3.selectAll('.classf_' + pos)
      .attr('stroke', 'black')
      .attr('stroke-width', '2')
      .style('filter', 'url(#selection-shadow)');
  }
  private removeFieldStroke() {
    d3.selectAll('.classf_GK')
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      .style('filter', 'url(#active-shadow)');
    d3.selectAll('.classf_FW')
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      .style('filter', 'url(#active-shadow)');
    d3.selectAll('.classf_MF')
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      .style('filter', 'url(#active-shadow)');
    d3.selectAll('.classf_DF')
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      .style('filter', 'url(#active-shadow)');
  }

  // Create SVG for player on field
  createSVGPlayerOnField() {
    let id = 'field';

    let pos_property = ['GK', 'FW', 'DF', 'MF'];
    // Create svg here
    var fieldDiv: any = document.getElementById('field');
    //Create SVG
    var svg = d3
      .select(fieldDiv)
      .append('svg')
      .attr('height', 818)
      .attr('id', id + '_svg')
      .attr('width', 550);
    svg
      .style('position', 'absolute')
      .attr('background-image', "url('../../assets/soccerField.png")
      .style('left', '0px')
      .style('top', '0px');
    //
    let defs = svg
      .append('defs')
      .append('clipPath')
      .attr('id', id + '_circle');
    pos_property.forEach(position => {
      let playerList = this.getProperty(
        this.playerOnField,
        position as keyof PlayerByPosition
      ) as any[];
      this.createPlayerFieldCircle(playerList, svg, defs, position);
    });
  }
  private createPlayerFieldCircle(
    players: any[],
    svg: d3.Selection<any, unknown, null, undefined>,
    defs: d3.Selection<any, unknown, null, undefined>,
    currentPos: string
  ) {
    let g_wrapper = svg.append('g').attr('id', 'field' + currentPos);

    let self = this;
    let x = 270;
    let y = 35;
    let r = 20;
    let r2 = 20;
    let color = COLOR_MAP.get(currentPos) as string;

    for (let i = 0; i < players.length; i++) {
      let currentClass = 'classf_' + currentPos;
      let playerID = players[i].id;
      let circle_tag = g_wrapper.attr('id') + '_' + CIRCLE_ID;

      if (players[i].salary > 10000000) {
        r2 = 55;
      } else if (players[i].salary > 1000000) {
        r2 = 30;
      } else {
        r2 = 5;
      }
      //Adding circle with absolute position hardcoded
      if (currentPos == 'GK') {
        x = 300;
        y = 90;
      } else if (currentPos == 'DF') {
        if (i == 0) {
          x = 145;
          y = 170;
        } else if (i == 1) {
          x = 430;
          y = 180;
        }
        if (i >= cur_DF) {
          break;
        }
      } else if (currentPos == 'MF') {
        switch (i) {
          case 0:
            x = 145;
            y = 320;
            break;
          case 1:
            x = 130;
            y = 470;
            break;
          case 2:
            x = 290;
            y = 380;
            break;
          case 3:
            x = 440;
            y = 470;
            break;
          case 4:
            x = 430;
            y = 320;
            break;

          default:
            break;
        }
        if (i >= MAX_MF) {
          break;
        }
      } else if (currentPos == 'FW') {
        switch (i) {
          case 0:
            x = 125;
            y = 650;
            break;
          case 1:
            x = 440;
            y = 650;
            break;
          case 2:
            x = 280;
            y = 600;
            break;
        }
        if (i >= MAX_FW) {
          break;
        }
      }
      defs
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r)
        .attr('class', currentClass)
        .attr('id', 'def_' + CIRCLE_ID);

      g_wrapper
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r + 1)
        .attr('class', currentClass)
        .attr('stroke', color)
        .attr('fill', color)
        .attr('id', 'inner_' + CIRCLE_ID);

      g_wrapper
        .on('mouseover', (e: any) => this.showTip(e))
        .on('mouseout', () => this.hideTip())
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r2 + 40)
        .attr('class', currentClass)
        .attr('stroke', 'color')
        .attr('fill', color)
        .attr('id', 'e_' + CIRCLE_ID)
        .style('filter', 'url(#active-shadow)')
        .on('mouseover', this.tip.show)
        .on('mouseout', this.tip.hide);

      g_wrapper
        .append('image')
        .attr('xlink:href', players[i].Img)
        .attr('clip-path', `url(#${defs.attr('id')})`)
        .attr('width', 40)
        .attr('heigth', 40)
        .attr('class', currentClass)
        .attr('x', x - r)
        .attr('id', 'f_' + CIRCLE_ID)
        .attr('y', y - r)
        .on('mouseover', this.tip.show)
        .on('mouseout', this.tip.hide);

      this.colorPlayerInLegend(playerID);
      this.positionIdMap.set(CIRCLE_ID, playerID);
      CIRCLE_ID++;

      x += 60;
    }
  }
  //Create the scaler
  private createSalaryScale() {
    // Create svg here
    var fieldDiv: any = document.getElementById('salaryScale');
    //Create SVG
    var svg = d3
      .select(fieldDiv)
      .append('svg')
      .attr('width', 380)
      .attr('height', 225)
      .attr('id', 'scale');
    let defs = svg.append('defs');

    // Create effect for field circle and shadow reponsive effect
    let linearGradient = defs
      .append('linearGradient')
      .attr('id', 'Gradient-1')
      .attr('x1', '20%')
      .attr('y1', '30%')
      .attr('x2', '40%')
      .attr('y2', '80%');
    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#B8D0DF');
    linearGradient
      .insert('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#73A2BD');

    let filterActiveShadow = defs
      .insert('filter')
      .attr('id', 'active-shadow')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('height', '130%')
      .attr('width', '130%');
    filterActiveShadow
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);
    filterActiveShadow
      .append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetblur');
    filterActiveShadow
      .append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', '0.3');
    let feMerge = filterActiveShadow.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    let filterInactiveShadow = defs
      .insert('filter')
      .attr('id', 'inactive-shadow')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('height', '130%')
      .attr('width', '130%');
    filterInactiveShadow
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);
    filterInactiveShadow
      .append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetblur');
    filterInactiveShadow
      .append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', '0.15');
    let feMerge2 = filterInactiveShadow.append('feMerge');
    feMerge2.append('feMergeNode');
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

    let filterSelection = defs
      .insert('filter')
      .attr('id', 'selection-shadow')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('height', '130%')
      .attr('width', '130%');
    filterSelection
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);
    filterSelection
      .append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetblur');
    filterSelection
      .append('feComponentTransfer')
      .append('feFuncB')
      .attr('type', 'linear')
      .attr('slope', '0.10');
    let feMerge3 = filterSelection.append('feMerge');
    feMerge3.append('feMergeNode');
    feMerge3.append('feMergeNode').attr('in', 'SourceGraphic');

    this.generateLegendField(svg)
  }
  //Make the outerEdge of the rectangle
  private outerEdge() {
    // var fieldDiv:any = document.getElementById("start");
    // d3.select(fieldDiv).append("svg")
    // .attr("id","curved_rec")
    // .attr("width",1000)
    // .attr("height",1000)
    // .append("rect")
    // .attr("stroke","black")
  }

  private pieInit() {
    var r = 90;

    var piechart = d3
      .select('#players')
      .append('svg')
      .attr('width', 400)
      .attr('height', 250)
      .attr('id', 'piechart')
      .attr('class', 'piechart')
      .append('g')
      .attr('id', 'donut-container')
      .attr('class', 'donut-container')
      .attr('transform', `translate(${r}, ${r})`);

    const height = 500;
    const arc = d3
      .arc()
      .innerRadius((0.2 * height) / 2)
      .outerRadius((0.3 * height) / 2);
    // console.log(this.teamValue)
    const resultsTeamValue: number[] = this.teamValue.map(r => r.value);
    const resultsOnFieldValue: number[] = this.onFieldValue.map(r => r.value);
    this.totalTeamValue = Object.values(resultsTeamValue).reduce(
      (acc, val) => acc + val,
      0
    );
    this.totalOnFieldValue = Object.values(resultsOnFieldValue).reduce(
      (acc, val) => acc + val,
      0
    );

    this.totalTeamValue = +(this.totalTeamValue / 1000000).toFixed(1);
    this.totalOnFieldValue = +(this.totalOnFieldValue / 1000000).toFixed(1);
    console.log(this.totalTeamValue);
    console.log(this.totalOnFieldValue);
    const pieChart = d3
      .pie()
      .startAngle(0 * (Math.PI / 90))
      .endAngle(180 * (Math.PI / 90));
    const data_Team = pieChart(resultsTeamValue);
    const data_Field = pieChart(resultsOnFieldValue);

    const arcs1 = piechart
      .append('g')
      .attr('id', 'teamValuePie')
      .attr('class', 'donut')
      .attr('transform', `translate(200, 0)`)
      .selectAll('path')
      .data(data_Team)
      .enter();

    // SOURCE https://stackoverflow.com/questions/35413072/compilation-errors-when-drawing-a-piechart-using-d3-js-typescript-and-angular/38021825
    arcs1
      .append('path')
      .attr('d', <any>arc)
      .attr('fill', (d, i) => this.color[i])
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('opacity', 0.9);

    const arcs2 = piechart
      .append('g')
      .attr('id', 'FieldSalaryContainer')
      .append('g')
      .attr('id', 'FieldValuePie')
      .attr('class', 'donut')
      .attr('transform', `translate(0, 0)`)
      .selectAll('path')
      .data(data_Field)
      .enter();

    // SOURCE https://stackoverflow.com/questions/35413072/compilation-errors-when-drawing-a-piechart-using-d3-js-typescript-and-angular/38021825
    arcs2
      .append('path')
      .attr('class', 'slice')
      .attr('d', <any>arc)
      .attr('fill', (d, i) => this.color[i])
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('opacity', 0.9);

    // Generate and append text for salary total and on the field
    this.generateTextSalary()

    this.generateLegend()

  }
  private generateLegendField(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>){
    svg
      .append('circle')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', 20)
      .attr('stroke', 'black')
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,5')
      .style('');

    svg
      .append('circle')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', 95)
      .attr('stroke', 'black')
      .attr('stroke-width', 3)
      .style('stroke-opacity', 0.9)
      .style('fill', '#263238')
      .style('opacity', 0.1)
      .style('');

    svg
      .append('circle')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', 45)
      .attr('stroke', 'black')
      .attr('stroke-width', 3)
      .style('stroke-opacity', 0.9)
      .style('fill', '#263238')
      .style('opacity', 0.1)
      .style('');

    svg
      .append('circle')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', 70)
      .attr('stroke', 'black')
      .attr('stroke-width', 3)
      .style('stroke-opacity', 0.9)
      .style('fill', '#263238')
      .style('opacity', 0.1)
      .style('');

    svg
      .append('text')
      .attr('x', 190)
      .attr('y', 150)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('<1M');
    svg
      .append('text')
      .attr('x', 190)
      .attr('y', 175)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('1-10M');
    svg
      .append('text')
      .attr('x', 190)
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('>10M');

    svg
      .append('text')
      .attr('x', 0)
      .attr('y', 15)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:18;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('Légende:');
  }

  private generateTextSalary(){
    d3.select('#teamValuePie')
      .append('text')
      .attr('id', 'teamValuePieNumber')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .style('font-family', 'IBM Plex Sans')
      .style('font-size', '26')
      .style('fill', '#263238')
      .text(this.totalTeamValue + 'M$');

    d3.select('#FieldSalaryContainer')
      .append('text')
      .attr('id', 'FieldValuePieNumber')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .style('font-family', 'IBM Plex Sans')
      .style('font-size', '26')
      .style('fill', '#263238')
      .text(this.totalOnFieldValue + 'M$');

    d3.select('#teamValuePie')
      .append('text')
      .attr('id', 'teamValuePieText')
      .attr('text-anchor', 'middle')
      .attr('y', 13)
      .style('font-weight', 'bold')
      .style('font-family', 'IBM Plex Sans')
      .style('fill', '#263238')
      .style('font-size', '10')
      .text("Valeur de l'équipe");

    d3.select('#FieldSalaryContainer')
      .append('text')
      .attr('id', 'FieldValuePieText')
      .attr('text-anchor', 'middle')
      .attr('y', 13)
      .style('font-weight', 'bold')
      .style('font-family', 'IBM Plex Sans')
      .style('font-size', '10')
      .style('fill', '#263238')
      .text('Joueur sur le terrain');
  }

  private generateLegend(){
    let legend = d3.select('#piechart').append('g');
    legend
      .append('rect')
      .attr('fill', COLOR_MAP.get('GK') as string)
      .attr('width', 15)
      .attr('height', 15)
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .attr('x', 20)
      .attr('y', 180);
    legend
      .append('text')
      .attr('x', 40)
      .attr('y', 191)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('Gardien');

    legend
      .append('rect')
      .attr('fill', COLOR_MAP.get('DF') as string)
      .attr('width', 15)
      .attr('height', 15)
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .attr('x', 100)
      .attr('y', 180);

    legend
      .append('text')
      .attr('x', 120)
      .attr('y', 191)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('Défense');

    legend
      .append('rect')
      .attr('fill', COLOR_MAP.get('MF') as string)
      .attr('width', 15)
      .attr('height', 15)
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .attr('x', 185)
      .attr('y', 180);

    legend
      .append('text')
      .attr('x', 205)
      .attr('y', 191)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('Milieu de terrain');

    legend
      .append('rect')
      .attr('fill', COLOR_MAP.get('FW') as string)
      .attr('width', 15)
      .attr('height', 15)
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .attr('x', 310)
      .attr('y', 180);

    legend
      .append('text')
      .attr('x', 330)
      .attr('y', 191)
      .attr('text-anchor', 'start')
      .attr('style', 'font-size:12;')
      .attr('font-weight', 'bold')
      .style('fill', '#263238')
      .text('Attaque');
  }
}
