import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisBottom, axisLeft, timeHours } from 'd3';

@Component({
  selector: 'app-data-viz1',
  templateUrl: './data-viz1.component.html',
  styleUrls: ['./data-viz1.component.css']
})
export class DataViz1Component implements OnInit {
  viewedData: any
  data:any
  svg: any

  numCols:number = 2
  topTeams: number = 12
  fontSize:number = 12
  width: number = 1100
  legendWidth :number= 300
  legendHeight:number = 20
  
  chartMargin = {left:100, right:100, top:80, bottom:80}
  margin = {left:20, top:20, bottom:20, right:20}
  
  chartGroupWidth:number = this.width / this.numCols;
  chartGroupHeight:number = this.chartGroupWidth;
  height: number = (this.chartGroupHeight) * 4

  units:any = {'Age':'Ans', 'Crds':'Cartons', 'Subs':'Remplacements'}
  orderingCategories: any[] = [    
  { value: 'Gls', viewValue: 'Buts marqués' },
  { value: 'VSGls', viewValue: 'Buts encaissés' },
  { value: 'Pts', viewValue: 'Pointage'},
  { value: 'MP', viewValue: 'Nombre de parties jouées'},
  { value: 'Ast', viewValue: 'Nombre de passes décisives'},
  { value: 'Gls.1', viewValue: 'Nombre de buts par partie jouées'},
  { value: 'PKRatio', viewValue: 'Ratio réussite penality' },]

  gradientCategories: any[] = [
    { value: 'Age', viewValue:"Age moyen des joueurs de l'équipe"},
    { value: 'Crds', viewValue: 'Nombre de cartons'},
    { value: 'Subs', viewValue:'Nombre de remplacements'}
  ]
  selectedGradientCategory: string = 'Age'

  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_vis1.json')
    .then((data: any) => {
      this.viewedData = data;
      this.data = data;
      
    })
    .then(() => {
      this.createSvg()
    });
  }


  onSelectGradient() {
    this.clearSvg();
    this.createSvg();
  }

  private sortOrdering(category: any): void {
    let newData = this.data.map((d:any) => d)

    newData = newData.sort((a:any, b:any):number => {
      if (a[category] < b[category]) {
        return 1;
      } else {
        return -1;
      }
    })
    return newData.slice(0,this.topTeams);
    // newData.map((d:any, i: number) => {
    //   const index = this.data.findIndex((x:any) => x.Squad === d.Squad);
    //   this.data[index]['Index'] = i;
    // });
  }

  coordinates(index:number): any {
    const x = this.chartGroupWidth * (index % this.numCols)
    const y = this.chartGroupHeight * Math.floor(index / this.numCols) + 50
    return {x:x, y:y}
  }

  createSvg() {
    this.svg = d3
    .select('#vis1')
    .append('svg')
    .attr('id', 'vis1-svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .append('g')
    .attr('fill', 'black')
    .attr('id', 'vis1-svg-g');

    this.createLegend();
    for (var i=0;i<this.orderingCategories.length;i++) {
      // g.append('rect')
      //   .attr('width', this.chartWidth - this.chartMargin.right)
      //   .attr('height', this.chartHeight - this.chartMargin.bottom)
      //   .attr('x', coord.x + this.chartMargin.left)
      //   .attr('y', coord.y + this.chartMargin.top)
      const coord = this.coordinates(i)
      var chartData = this.sortOrdering(this.orderingCategories[i].value)
      this.render(this.orderingCategories[i], coord, chartData)
    }

    // this.render(category);
  }

  render(category:any, coord:any, chartData:any) {
    var g = this.svg.append('g')
      .attr('width', this.chartGroupWidth)
      .attr('height', this.chartGroupHeight)
      .attr('x', coord.x)
      .attr('y', coord.y) // individual chart container
      const innerWidth =  this.chartGroupWidth -  this.chartMargin.right - this.chartMargin.left;
      const innerHeight = this.chartGroupHeight - this.chartMargin.top -   this.chartMargin.bottom;
      var x = coord.x + this.chartMargin.left // actual chart coordinates
      var y = coord.y + this.chartMargin.top

    const xValue = (d:any) => d[category.value];
    const colorValue = (d:any) => d[this.selectedGradientCategory];
    const yValue = (d:any) => d.Squad;

    const minColor = d3.min(this.data as number[], colorValue);
    const maxColor = d3.max(this.data as number[], colorValue);
    const max = d3.max(chartData as number[], xValue);

    const xScale = d3.scaleLinear()
      .domain([max, 0])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(chartData.map(yValue))
      .range([0, innerHeight])
      .padding(0.2);

    const colorScale = d3.scaleLinear<string>()
      .domain([minColor, maxColor])
      .range(["blue", "red"]);

    g.append('g')
      .attr('class', 'tick')
      .call(axisLeft(yScale))
      .attr('transform', `translate(${x}, ${y})`);

    g.append('g')
      .style('font-size','1em')
      .call(axisBottom(xScale))
      .attr('transform', `translate(${x}, ${y + innerHeight})`);

    g.append('line')
      .attr('x1',x + innerWidth)
      .attr('x2',x + innerWidth)
      .attr('y1', y)
      .attr('y2', y + innerHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', '1px');

    g.selectAll('rect').data(chartData).enter()
      .append('g')
      .attr('class', 'tick')
      .append('text')
      .attr('y', (d:any) => y + yScale(yValue(d)) as number + yScale.bandwidth()/2 + this.fontSize/2)
      .attr('x', x + innerWidth + 10 )
      .attr('fill', 'black')
      // .attr('style', `font-size: ${this.fontSize};`)
      .text((d:any) => xValue(d));

    g.selectAll("rect").data(chartData)
    .enter().append('rect')
    .attr('y', (d:any) => y + yScale(yValue(d)))
    .attr('x', (d:any) => x + xScale(xValue(d)))
    .attr('width', (d:any) => innerWidth - xScale(xValue(d)))
    .attr('height', (d:any) => yScale.bandwidth())
    .attr('fill',(d:any) => colorScale(colorValue(d)));

    g.append('g')
      .attr('x', x + 5)
      .attr('y', y - 20)
      .attr('fill', 'black')
      .attr('class', 'title-viz2')
      .attr('style', `font-size: ${this.fontSize * 1.5}px;`)
      .text(category.viewValue);
  }

  clearSvg() {
    d3.selectAll('#vis1-svg').remove();
  }

  createLegend() {
    var g = this.svg.append('g');
    var defs = this.svg.append('defs');
    const colorValue = (d:any) => d[this.selectedGradientCategory];
    const minColor = d3.min(this.viewedData as number[], colorValue);
    const maxColor = d3.max(this.viewedData as number[], colorValue);

    var gradient = defs.append('linearGradient')
      .attr('id', 'legend')
      .attr('x1', '0%')
      .attr('x2', '100%');
      // .attr('y1', '0%')
      // .attr('y2', '100%')


    gradient.append('stop')
      .attr('class','start')
      .attr('offset', '0%')
      .attr('stop-color', 'blue')
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('class','end')
      .attr('offset', '100%')
      .attr('stop-color', 'red')
      .attr('stop-opacity', 1);

    var legendx = (this.width + this.margin.left)/2 - this.legendWidth/2;
    var legendy = 40;
    // g.append('g')
    //   .attr('id', 'legendText')
    //   .attr('class', 'legendTitleContainer')
    //   .append('text')
    //   .attr('fill', 'black')
    //   .attr('style', `font-size: ${this.fontSize}px;`)
    //   .text(maxColor);

      g.append('rect')
      .attr('width', this.legendWidth)
      .attr('height', this.legendHeight)
      .attr('y', legendy)
      .attr('x', legendx)
      .attr('fill', 'url(#legend)');

    var yTextOffset = (this.legendHeight + 10)/2;
    g.append('text')
      .attr('x', legendx + this.legendWidth + 5)
      .attr('y', legendy + yTextOffset)
      .attr('fill', 'black')
      .attr('style', `font-size: ${this.fontSize}px;`)
      .text(maxColor);
    
    g.append('text')
    .attr('x', legendx - 40)
    .attr('y', legendy + yTextOffset)
    .attr('fill', 'black')
    .attr('style', `font-size: ${this.fontSize}px;`)
    .text(minColor);

    var text = g.append('text')
    .attr('y', legendy - this.legendHeight)
    .attr('fill', 'black')
    .attr('class', 'title-viz2')
    .attr('style', `font-size: ${this.fontSize * 1.5}px;`)
    .text(`Légende (${this.units[this.selectedGradientCategory]})`);

    text.attr('x', legendx + this.legendWidth/2 - text.node().getBoundingClientRect().width/2)

  }
}
