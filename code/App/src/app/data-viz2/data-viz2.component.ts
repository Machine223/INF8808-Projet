import { Component, OnInit } from '@angular/core';
import { numbers } from '@material/select';
import * as d3 from 'd3';
import { axisBottom, axisLeft, axisTop, color, max, scaleBand, scaleLinear, stack, transpose } from 'd3';

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
  private rows: number = 1;
  private cols: number = 1;

  selectedCategory: any;
  categories: any[] = [
    { value: 'canada', viewValue: 'Joueur Canadien' },
    { value: 'concacaf', viewValue: 'Joueur de la Concacaf' },
    { value: 'formation', viewValue: 'Afficher le club de formation' },
    { value: 'club', viewValue: 'Afficher le club de actuelle' },
  ];
  headers: string[] = [ 'Joueur Canadien', 'Joueur de la Concacaf'];


  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_vis2.json')
      .then((data: any) => {
        this.data = data;
        // console.table(this.data);
        // this.sortPlayers('MP'); // sort player by default mode
      })
      .then(() => {
        this.createSvg();
      });
  }

  onSelect(): any {
    // console.table("hello category is selected:", this.categories)
  }

  private createSvg(): void {

    // get data attribute from data file
    const xValue = (d: { Gls: number; }) => d.Gls
    const x2Value = (d: { Ast: number; }) => d.Ast
    const yValue = (d: { Player: string; }) => d.Player

    // set the dimensions and margins of the graph
    const margin = { top:70, right:20, bottom:20, left:150 };
    const innerWidth = this.width- margin.left - margin.right;
    const innerHeight = this.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    this.svg = d3
      .select('#vis2')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', 'vis2-svg')
      .attr("transform", `translate(0,0)`);


    // Create X and Y axis DOMAIN and RANGE SCALE
    const xScale = scaleLinear()
      .domain([0,max(this.data, d => d.Gls + d.Ast)])
      .range([0,innerWidth]);
    const yScale = scaleBand()
      .domain(this.data.map(yValue))
      .range([0,innerHeight])
      .padding(0.4);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Custom axis X and Y
    const xAxis = axisTop(xScale).tickSize(-innerHeight)
    const yAxis = axisLeft(yScale)


    // this.data.forEach(function(d){
    //   var x0 = 0;
    //   d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
    //   d.total = d.ages[d.ages.length - 1].y1;
    // })
    // this.data.forEach((d) =>{
    //     console.log("hello")
    //     var x0 = 0
    //     d.ages =  color.domain().map((d)=>{
    //       return{
    //         Player:
    //       }
    //     })
    //     console.log(d)
    // })


    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)



    // Append the Y Axis
    g.append('g').attr('class', 'yAxis').call(yAxis)
      .selectAll('.domain, .tick line').remove();
    // Add the X Axis
    g.append('g').attr('class', 'xAxis').call(xAxis)
      .selectAll('.domain').remove();


    // ne marche pas encore trouver un meilleur moyen de stack
    // const dataMatrix: any[][] = [
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [3,12],
    //   [0,5],
    //   [2,12],
    //   [20,5],
    //   [2,0],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [0,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [2,12],
    //   [20,5],
    //   [2,12],
    //   [20,5],
    // ]
    // console.log('dataMatrix',dataMatrix)
    // const stackData = stack().keys(Object.keys(this.data))(dataMatrix as any);
    // console.log('stackData',stackData)

    // const stacks  = this.svg.selectAll(".layer").data(stackData);
    // console.log('stackData',stacks)
    // const layer = stacks.enter().append('g').attr('class', 'layer').attr('fill',(_: any,i: any) => red)
    // console.log("layer", layer);
    // console.log("Color", this.data[2].color);

    g.selectAll('rect').data(this.data)
      .enter().append('rect')
      .attr('fill', '#5ccbf0')
      .attr('y', (d: { Player: string; }) => yScale(yValue(d)))
      .attr('width', (d: { Ast: number; Gls: number }) => xScale(xValue(d)+x2Value(d)))
      .attr('height',yScale.bandwidth())
    // layer.selectAll('rect').data(this.data)
    //   .enter().append('rect')
    //   .attr('fill', '#5ccbf0')
    //   .attr('y', (d: { Player: string; }) => yScale(yValue(d)))
    //   .attr("x", (d: { Ast: number; Gls: number }) => xScale(xValue(d)+x2Value(d)))
    //   .attr('width', (d: { Ast: number; Gls: number }) => xScale(xValue(d)+x2Value(d)))
    //   .attr('height',yScale.bandwidth())

    g.append('text').attr('y', -30).text(`${this.headers[0]}`).attr('class','title-viz2')
  }

}


