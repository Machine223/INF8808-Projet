import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisLeft, axisTop, max, scaleBand, scaleLinear } from 'd3';
//@ts-ignore
import d3Tip from 'd3-tip';

@Component({
  selector: 'app-data-viz2',
  templateUrl: './data-viz2.component.html',
  styleUrls: ['./data-viz2.component.css']
})
export class DataViz2Component implements OnInit {
  private data: any[] = [];
  private svg: any;
  private width: number = 800;
  private height: number = 800;
  categories: any[] = [
    { value: 'canada', viewValue: 'Joueur Canadien' },
    { value: 'concacaf', viewValue: 'Joueur de la Concacaf' },
    // { value: 'formation', viewValue: 'Afficher le club de formation' },
    // { value: 'club', viewValue: 'Afficher le club de actuelle' },
  ];
  actualCat : any;
  headers: string[] = [ 'Joueur Canadien', 'Joueur de la Concacaf'];
  selectedCategory: any;
  tipCad = d3Tip()
    .attr('class', 'd3-tip')
    .html(function (e: any, d: any) {
      return `<p class='tooltip-title' style="margin-top: 0px">Joueur : <b>${d['data']['Player']}</b></p>\
      <div class='tooltip-value'>Position : ${d['data']['Pos']}</div>\
      <div class='tooltip-value'>Nombre de <span class="tooltip-gls">buts : ${d['data']['Gls']}</span></div>\
      <div class='tooltip-value'>Nombre de <span class="tooltip-ast">passes décisives : ${d['data']['Ast']}</span></div>\
      <div class='tooltip-value'>Nombre de <span class="tooltip-mp">parties jouées : ${d['data']['MP']}</span></div>
      <div class='tooltip-value'>Équipe : ${d['data']['Squad']}</span></div>
      <div class='tooltip-value'>Club actuel : ${d['data']['Club']}</span></div>
      <div class='tooltip-value'>Club de formation : ${d['data']['Formation']}, ${d['data']['PaysFormation']}</span></div>`;
    });
  tipConcacaf = d3Tip()
  .attr('class', 'd3-tip')
  .html(function (e: any, d: any) {
    return `<p class='tooltip-title' style="margin-top: 0px">Joueur : <b>${d['data']['Player']}</b></p>\
    <div class='tooltip-value'>Position : ${d['data']['Pos']}</div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-gls">buts : ${d['data']['Gls']}</span></div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-ast">passes décisives : ${d['data']['Ast']}</span></div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-mp">parties jouées : ${d['data']['MP']}</span></div>
    <div class='tooltip-value'>Équipe : ${d['data']['Squad']}</span></div>`;
  });

  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_vis2.json')
      .then((data: any) => {
        this.data = data;
        this.sortPlayers();
        this.actualCat = this.categories[0];
        // console.table(this.data);
        // this.sortPlayers('MP'); // sort player by default mode
      })
      .then(() => {
        this.createSvg();
      });
  }

  onSelect(event: any): any {
    if(event.value == this.categories[0].value){
      this.actualCat = this.categories[0];
      d3.json('../../assets/data_vis2.json')
      .then((data: any) => {
        this.data = data;
        this.sortPlayers();
        // console.table(this.data);
        // this.sortPlayers('MP'); // sort player by default mode
      })
      .then(() => {
        this.clearSvg()
        this.createSvg();
      });
    }else if(event.value == this.categories[1].value){
      this.actualCat = this.categories[1];
      d3.json('../../assets/data_vis2.1.json')
      .then((data: any) => {
        this.data = data;
        this.sortPlayers();
      })
      .then(() => {
        this.clearSvg()
        this.createSvg();
      });
    }
  }

  clearSvg() {
    d3.selectAll('#vis2-svg').remove()
  }

  private sortPlayers(): void {
    let newData = this.data.map(d => d);
    newData = newData.sort(function (
      firstPlayer: any,
      secondPlayer: any
    ): number {
      if ((firstPlayer['Gls']+firstPlayer['Ast']) < (secondPlayer['Gls']+ secondPlayer['Ast']) ) {
        return 1;
      } else {
        return -1;
      }
    });
    newData.map((d, i) => {
      const index = this.data.findIndex(x => x['Player'] === d['Player']);
      this.data[index]['Index'] = i;
    });
    newData.splice(20)
    this.data = newData
  }

  private createSvg(): void {

    // get data attribute from data file
    const xValue = (d: { Gls: number; }) => d.Gls
    const x2Value = (d: { Ast: number; }) => d.Ast
    const yValue = (d: { Player: string; }) => d.Player

    // List of subgroups = header of the csv files = soil condition here
    var subgroups = ['Gls','Ast']


    // set the dimensions and margins of the graph
    const margin = { top:70, right:20, bottom:20, left:150 };
    const innerWidth = this.width- margin.left - margin.right;
    const innerHeight = this.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    this.svg = d3
      .select('#vis2')
      .append('svg')
      .attr('id', 'vis2-svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', 'vis2-g')
      .attr("transform", `translate(0,0)`);

    if( this.actualCat == this.categories[0]){
      this.svg.call(this.tipCad);
    }else{
      this.svg.call(this.tipConcacaf);
    }


    // Create X and Y axis DOMAIN and RANGE SCALE
    const xScale = scaleLinear()
      .domain([0,max(this.data, d => d.Gls + d.Ast)])
      .range([0,innerWidth]);
    const yScale = scaleBand()
      .domain(this.data.map(yValue))
      .range([0,innerHeight])
      .padding(0.4);

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
    .range(['#4381B6','#97B3CB'])


    // Custom axis X and Y
    const xAxis = axisTop(xScale).tickSize(-innerHeight)
    const yAxis = axisLeft(yScale)

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
    .keys(subgroups)
    (this.data)

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)


    // Append the Y Axis
    g.append('g').attr('class', 'yAxis').call(yAxis)
      .selectAll('.domain, .tick line').remove();
    // Add the X Axis
    g.append('g').attr('class', 'xAxis').call(xAxis)
      .selectAll('.domain').remove();

    if( this.actualCat == this.categories[0]){
      // Show the stacked bars
      g.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function(d: { key: string; }) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d: any) { return d;  })
        .enter().append("rect")
          .attr('overflow', 'visible')
          .attr("y", (d: { data: { Player: string; }; }) => yScale(d.data.Player))
          .attr("x", (d: d3.NumberValue[]) => xScale(d[0]))
          .on('mouseover', this.tipCad.show)
          .on('mouseout', this.tipCad.hide)
          .on("mouseleave", this.tipCad.leave)
          .attr("height", yScale.bandwidth())
          .attr("width",(d: any) =>  xScale(d[1]) - xScale(d[0]))

      // Show text header
      g.append('text').attr('y', -30).text(`${this.headers[0]}`).attr('class','title-viz2')
    }else{
      // Show the stacked bars
      g.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function(d: { key: string; }) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d: any) { return d;  })
        .enter().append("rect")
          .attr('overflow', 'visible')
          .attr("y", (d: { data: { Player: string; }; }) => yScale(d.data.Player))
          .attr("x", (d: d3.NumberValue[]) => xScale(d[0]))
          .on('mouseover', this.tipConcacaf.show)
          .on('mouseout', this.tipConcacaf.hide)
          .on("mouseleave", this.tipConcacaf.leave)
          .attr("height", yScale.bandwidth())
          .attr("width",(d: any) =>  xScale(d[1]) - xScale(d[0]))

      // Show text header
      g.append('text').attr('y', -30).text(`${this.headers[1]}`).attr('class','title-viz2')
    }

    // select the svg area
    var legend = d3.select('#vis2-g').append('g').attr('id', 'vis2-legend')
    // create a list of keys
    var legendKeys = ["Nombre de but", "Nombre d’assists"]

    // Usually you have a color scale in your chart already
    var colorLegend = d3.scaleOrdinal()
    .domain(legendKeys)
    .range(['#4381B6','#97B3CB']);
    // Handmade legend
    legend.append("rect").attr("x",0).attr("y",0).attr("width",25).attr("height",25).style("fill", "#4381B6")
    legend.append("rect").attr("x",0).attr("y",40).attr("width",25).attr("height",25).style("fill", "#97B3CB")
    legend.append("text").attr("x", 40).attr("y", 12).text("Nombre de but").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("text").attr("x", 40).attr("y", 52).text("Nombre d’assists").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("text").attr("x", 0).attr("y", -24).text("Légende").style("font-size", "17px").attr("alignment-baseline","middle")

    legend.attr("transform", `translate(600,650)`)

  }

}


