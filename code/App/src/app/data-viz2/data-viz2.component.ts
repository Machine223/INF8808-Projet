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
        this.sortPlayers();
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

  private sortPlayers(): void {
    let newData = this.data.map(d => d);
    newData = newData.sort(function (
      firstPlayer: any,
      secondPlayer: any
    ): number {
      if ((firstPlayer['Ast']+firstPlayer['Gls']) < (secondPlayer['Ast']+ secondPlayer['Gls']) ) {
        return 1;
      } else {
        return -1;
      }
    });
    newData.map((d, i) => {
      const index = this.data.findIndex(x => x['Player'] === d['Player']);
      this.data[index]['Index'] = i;
    });
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

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
    .range(['#e41a1c','#377eb8'])


    // Custom axis X and Y
    const xAxis = axisTop(xScale).tickSize(-innerHeight)
    const yAxis = axisLeft(yScale)

    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
    .keys(subgroups)
    (this.data)

    console.log(stackedData)

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)


    // Append the Y Axis
    g.append('g').attr('class', 'yAxis').call(yAxis)
      .selectAll('.domain, .tick line').remove();
    // Add the X Axis
    g.append('g').attr('class', 'xAxis').call(xAxis)
      .selectAll('.domain').remove();

    g.append('g').selectAll('g').data(stackedData).enter().append('g')
      .attr

    // Show the bars
    g.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d: { key: string; }) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d: any) { return d; })
      .enter().append("rect")
        .attr("y", (d: { data: { Player: string; }; }) => yScale(d.data.Player))
        .attr("x", (d: d3.NumberValue[]) => xScale(d[0]))
        .attr("height", yScale.bandwidth())
        .attr("width",(d: any) =>  xScale(d[1]) - xScale(d[0]))

    // Show text header
    g.append('text').attr('y', -30).text(`${this.headers[0]}`).attr('class','title-viz2')



  }

}


