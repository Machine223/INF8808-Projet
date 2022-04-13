import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisBottom, axisLeft } from 'd3';

@Component({
  selector: 'app-data-viz1',
  templateUrl: './data-viz1.component.html',
  styleUrls: ['./data-viz1.component.css']
})
export class DataViz1Component implements OnInit {
  viewedData: any
  data:any
  svg: any
  top: number = 12
  width: number = 800
  height: number = 600
  margin = {left:320, top:20, bottom:50, right:20}
  legendWidth :number= 300
  legendHeight:number = 20
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
  selectedOrderingCategory: string = 'Gls'
  selectedGradientCategory: string = 'Age'

  constructor() { }

  ngOnInit(): void {
    d3.json('../../assets/data_vis1.json')
    .then((data: any) => {
      this.viewedData = data;
      this.data = data;
      this.sortOrdering(this.selectedOrderingCategory);

    })
    .then(() => {
      this.createSvg(this.selectedOrderingCategory);
    });
  }

  onSelectOrdering() {
    this.sortOrdering(this.selectedOrderingCategory);
    this.clearSvg();
    this.createSvg(this.selectedOrderingCategory);
  }

  onSelectGradient() {
    this.clearSvg();
    this.createSvg(this.selectedOrderingCategory);
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
    this.viewedData =  newData.slice(0,this.top);
    // newData.map((d:any, i: number) => {
    //   const index = this.data.findIndex((x:any) => x.Squad === d.Squad);
    //   this.data[index]['Index'] = i;
    // });
  }

  createSvg(category:string) {
    this.svg = d3
    .select('#vis1')
    .append('svg')
    .attr('id', 'vis1-svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .append('g')
    .attr('id', 'vis1-svg');

    this.createLegend();

    this.render(category);
  }

  render(category:string) {
    const xValue = (d:any) => d[category];
    const colorValue = (d:any) => d[this.selectedGradientCategory];
    const yValue = (d:any) => d.Squad;
    const innerWidth = this.width - this.margin.right - this.margin.left;
    const innerHeight = this.height - this.margin.top - this.margin.bottom - this.legendHeight;
    const minColor = d3.min(this.viewedData as number[], colorValue);
    const maxColor = d3.max(this.viewedData as number[], colorValue);
    const max = d3.max(this.viewedData as number[], xValue);
    const xScale = d3.scaleLinear()
    .domain([max, 0])
    .range([0, innerWidth]);

    
    const yScale = d3.scaleBand()
    .domain(this.viewedData.map(yValue))
    .range([0, innerHeight])
    .padding(0.2);

    const colorScale = d3.scaleLinear<string>()
      .domain([minColor, maxColor])
      .range(["blue", "red"]);

    const g = this.svg.append('g')
    .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    g.append('g').style('font-size', '20px').call(axisLeft(yScale));

    g.append('g').call(axisBottom(xScale))
    .attr('transform', `translate(0, ${innerHeight})`);
    g.append('line')
      .attr('x1',innerWidth)
      .attr('x2',innerWidth)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', '1px');

    g.selectAll('rect').data(this.viewedData).enter()
    .append("text") 
    .attr('y', (d:any) => yScale(yValue(d)) as number + yScale.bandwidth()/2 + 4)
    .attr('x', (d:any) => innerWidth + 3 )
    .attr('fill', 'black')
    .attr('style', 'font-size: 8px;')
    .text((d:any) => xValue(d));

    g.selectAll("rect").data(this.viewedData)
    .enter().append('rect')
    .attr('y', (d:any) => yScale(yValue(d)))
    .attr('x', (d:any) => xScale(xValue(d)))
    .attr('width', (d:any) => innerWidth - xScale(xValue(d)))
    .attr('height', (d:any) => yScale.bandwidth())
    .attr('fill',(d:any) => colorScale(colorValue(d)));


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
    var legendy = this.height - this.margin.top;
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
      .attr('style', 'font-size: 20px;')
      .text(maxColor);
    
    g.append('text')
    .attr('x', legendx - 40)
    .attr('y', legendy + yTextOffset)
    .attr('fill', 'black')
    .attr('style', 'font-size: 20px;')
    .text(minColor);

  }
}
