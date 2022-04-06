import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisBottom, axisLeft, max, scaleBand, scaleLinear } from 'd3';

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
    const xValue = (d: { Gls: d3.NumberValue; }) => d.Gls
    const x2Value = (d: { Ast: d3.NumberValue; }) => d.Ast
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

    // Create X and Y axis DOMAIN and RANGE
    const xScale = scaleLinear()
      .domain([0,max(this.data, d => d.Gls + 8)])
      .range([0,innerWidth]);
    const yScale = scaleBand()
      .domain(this.data.map(yValue))
      .range([0,innerHeight])
      .padding(0.4);

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Custom axis X and Y
    const xAxis = axisBottom(xScale).tickSize(innerHeight)
    const yAxis = axisLeft(yScale)

    // Append the Y Axis
    g.append('g').attr('class', 'yAxis').call(yAxis)
      .selectAll('.domain, .tick line').remove();
    // Add the X Axis
    g.append('g').attr('class', 'xAxis').call(xAxis)
      .selectAll('.domain').remove();

    const stackedData = d3.stack()(this.data)

    g.selectAll('rect').data(this.data)
      .enter().append('rect')
      .attr('fill', '#5ccbf0')
      .attr('y', (d: { Player: string; }) => yScale(yValue(d)))
      .attr('width', (d: { Gls: d3.NumberValue; }) =>xScale(xValue(d)))
      .attr('height',yScale.bandwidth())


    g.append('text').attr('y', -30).text(`${this.headers[0]}`).attr('class','title-viz2')
  }

}


