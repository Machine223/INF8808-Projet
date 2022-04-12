import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisBottom, axisLeft } from 'd3';

@Component({
  selector: 'app-data-viz1',
  templateUrl: './data-viz1.component.html',
  styleUrls: ['./data-viz1.component.css']
})
export class DataViz1Component implements OnInit {
  data: any
  svg: any
  width: number = 800
  height: number = 800
  margin = {left:180, top:20, bottom:50, right:20}
  legendWidth = 300
  legendHeight = 20
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
      this.data = data;
      this.sortOrdering(this.selectedOrderingCategory);

    })
    .then(() => {
      this.createSvg();
    });
  }

  onSelectOrdering() {
    this.sortOrdering(this.selectedOrderingCategory)
    this.clearSvg()
    this.createSvg()
  }

  onSelectGradient() {

  }

  private sortOrdering(category: any): void {
    let newData = this.data.map((d:any) => d)

    newData = newData.sort((a:any, b:any):number => {
      if (a[category] < b[category]) {
        return 1
      } else {
        return -1
      }
    })
    this.data =  newData
    // newData.map((d:any, i: number) => {
    //   const index = this.data.findIndex((x:any) => x.Squad === d.Squad);
    //   this.data[index]['Index'] = i;
    // });
  }

  createSvg() {
    this.svg = d3
    .select('#vis1')
    .append('svg')
    .attr('id', 'vis1-svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .append('g')
    .attr('id', 'vis1-svg')

    // this.createLegend()

    this.render()
  }

  render() {
    const xValue = (d:any) => d[this.selectedOrderingCategory]
    const yValue = (d:any) => d.Squad
    const innerWidth = this.width - this.margin.right - this.margin.left
    const innerHeight = this.height - this.margin.top - this.margin.bottom - this.legendHeight
    const max = d3.max(this.data as number[], xValue)
    const xScale = d3.scaleLinear()
    .domain([max, 0])
    .range([0, innerWidth])

    
    const yScale = d3.scaleBand()
    .domain(this.data.map(yValue))
    .range([0, innerHeight])
    .padding(0.2)

    const g = this.svg.append('g')
    .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

    g.append('g').call(axisLeft(yScale))
    g.append('g').call(axisBottom(xScale))
    .attr('transform', `translate(0, ${innerHeight})`)
    g.append('line')
      .attr('x1',innerWidth)
      .attr('x2',innerWidth)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', '1px')

    g.selectAll('rect').data(this.data).enter()
    .append("text") 
    .attr('y', (d:any) => yScale(yValue(d)) as number + yScale.bandwidth()/2 + 4)
    .attr('x', (d:any) => innerWidth + 3 )
    .attr('fill', 'black')
    .attr('style', 'font-size: 8px;')
    .text((d:any) => xValue(d))

    g.selectAll("rect").data(this.data)
    .enter().append('rect')
    .attr('y', (d:any) => yScale(yValue(d)))
    .attr('x', (d:any) => xScale(xValue(d)))
    .attr('width', (d:any) => innerWidth - xScale(xValue(d)))
    .attr('height', (d:any) => yScale.bandwidth())
    .attr('fill', '#4682b4')


  }

  clearSvg() {
    d3.selectAll('#vis1-svg').remove()
  }

  createLegend() {
    var defs = this.svg.append('defs')

    var gradient = defs.append('linearGradient')
      .attr('id', 'legend')
      .attr('x1', '0%')
      .attr('x2', '100%')
      // .attr('y1', '0%')
      // .attr('y2', '100%')


      gradient.append('stop')
        .attr('class','start')
        .attr('offset', '0%')
        .attr('stop-color', 'blue')
        .attr('stop-opacity', 1)

      gradient.append('stop')
        .attr('class','end')
        .attr('offset', '100%')
        .attr('stop-color', 'red')
        .attr('stop-opacity', 1)

      var legend = this.svg.append('rect')
        .attr('width', this.legendWidth)
        .attr('height', this.legendHeight)
        .attr('y', this.height - this.margin.top)
        .attr('x', (this.width + this.margin.left)/2 - this.legendWidth/2)
        .attr('fill', 'url(#legend)')

      // legend.append('text')

  }
}
