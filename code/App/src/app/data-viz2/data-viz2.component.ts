import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { axisLeft, axisTop, max, scaleBand, scaleLinear } from 'd3';
//@ts-ignore
import d3Tip from 'd3-tip';

@Component({
  selector: 'app-data-viz2',
  templateUrl: './data-viz2.component.html',
  styleUrls: ['./data-viz2.component.css'],
})
export class DataViz2Component implements OnInit {
  private data: any[] = [];
  private stackedData: any[] = [];
  private svg: any;
  private width: number = 900;
  private height: number = 800;
  // SVG margin for scale axis
  innerWidth:any;
  innerHeight:any
  categories: any[] = [
    { value: 'concacaf', viewValue: 'Joueur de la Concacaf' },
    { value: 'canada', viewValue: 'Joueur Canadien' },
  ];
  actualCat: any;
  headers: string[] = ['Joueur de la Concacaf', 'Joueur Canadien'];
  // List of subgroups = header of the data files
  subgroups = ['Gls', 'Ast'];
  // get data attribute from data file
  yValue = (d: { Player: string }) => d.Player;
  // Axis set & DOMAIN and RANGE
  private xAxis: any;
  private yAxis: any;
  private xScale: any;
  private yScale: any;
  // color palette = one color per subgroup
  color = d3.scaleOrdinal().range(['#4381B6', '#97B3CB']);
  legend: any;
  selectedCategory: any;
  tipCad = d3Tip()
    .attr('class', 'd3-tip')
    .html(function (_e: any, d: any) {
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
    .html(function (_e: any, d: any) {
      return `<p class='tooltip-title' style="margin-top: 0px">Joueur : <b>${d['data']['Player']}</b></p>\
    <div class='tooltip-value'>Position : ${d['data']['Pos']}</div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-gls">buts : ${d['data']['Gls']}</span></div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-ast">passes décisives : ${d['data']['Ast']}</span></div>\
    <div class='tooltip-value'>Nombre de <span class="tooltip-mp">parties jouées : ${d['data']['MP']}</span></div>
    <div class='tooltip-value'>Équipe : ${d['data']['Squad']}</span></div>`;
    });

  constructor() {}

  ngOnInit(): void {
    d3.json('../../assets/data_vis2.1.json')
      .then((data: any) => {
        this.data = data;
        this.sortPlayers();
        this.actualCat = this.categories[0];
      })
      .then(() => {
        this.createSvg();
      });
  }

  onSelect(event: any): any {
    if (event.value == this.categories[0].value) {
      this.actualCat = this.categories[0];
      d3.json('../../assets/data_vis2.1.json')
        .then((data: any) => {
          this.data = data;
          this.sortPlayers();
        })
        .then(() => {
          this.clearSvg();
          this.createSvg();
        });
    } else if (event.value == this.categories[1].value) {
      this.actualCat = this.categories[1];
      d3.json('../../assets/data_vis2.json')
        .then((data: any) => {
          this.data = data;
          this.sortPlayers();
        })
        .then(() => {
          this.clearSvg();
          this.createSvg();
        });
    }
  }

  clearSvg() {
    d3.selectAll('#vis2-svg').remove();
  }

  // sort data by number of GOALS + ASSISTS
  private sortPlayers(): void {
    let newData = this.data.map(d => d);
    newData = newData.sort(function (
      firstPlayer: any,
      secondPlayer: any
    ): number {
      if (
        firstPlayer['Gls'] + firstPlayer['Ast'] <
        secondPlayer['Gls'] + secondPlayer['Ast']
      ) {
        return 1;
      } else {
        return -1;
      }
    });
    newData.map((d, i) => {
      const index = this.data.findIndex(x => x['Player'] === d['Player']);
      this.data[index]['Index'] = i;
    });
    newData.splice(20);
    this.data = newData;
  }

  private createSvg(): void {
    // set the dimensions and margins of the graph
    const margin = { top: 70, right: 20, bottom: 20, left: 150 };
    this.innerWidth = this.width- margin.left - margin.right;
    this.innerHeight = this.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    this.generateSVG();

    // Create and set X and Y axis DOMAIN and RANGE SCALE
    this.setAxis();

    // convert normal data --> stack per subgroup data
    this.formatStackData();

    // create Translate G element to be able to adjust the main viz
    const g = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Append Y axis and X axis in the mian G element
    this.appendAxis(g);

    // Show the stacked bars
    this.generateStackedBarChart(g);

    // Show the stacked bars interaction Feedback
    this.generateBarChartFeedback(g);

    // create and show legend vis2-legend on the vis2-g view
    this.generateLegend();
  }

  private appendAxis(g: any) {
    // Append the Y Axis
    g.append('g')
      .attr('class', 'yAxis')
      .call(this.yAxis)
      .selectAll('.domain, .tick line')
      .remove();
    // Add the X Axis
    g.append('g')
      .attr('class', 'xAxis')
      .call(this.xAxis)
      .selectAll('.domain')
      .remove();
  }

  private generateSVG(): void {
    this.svg = d3
      .select('#vis2')
      .append('svg')
      .attr('id', 'vis2-svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', 'vis2-g')
      .attr('transform', `translate(0,0)`);

    if (this.actualCat == this.categories[1]) {
      this.svg.call(this.tipCad);
    } else {
      this.svg.call(this.tipConcacaf);
    }
  }

  private setAxis() {
    this.xScale = scaleLinear()
      .domain([0, max(this.data, d => d.Gls + d.Ast)])
      .range([0, this.innerWidth]);
    this.yScale = scaleBand()
      .domain(this.data.map(this.yValue))
      .range([0, this.innerHeight])
      .padding(0.4);

    // Custom axis X and Y
    this.xAxis = axisTop(this.xScale).tickSize(-this.innerHeight);
    this.yAxis = axisLeft(this.yScale);
  }

  private formatStackData() {
    this.stackedData = d3.stack().keys(this.subgroups)(this.data);
  }

  private generateLegend() {
    this.legend = d3.select('#vis2-g').append('g').attr('id', 'vis2-legend');
    // Handmade legend
    this.legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 25).attr('height', 25).style('fill', '#4381B6');
    this.legend.append('rect').attr('x', 0).attr('y', 40).attr('width', 25).attr('height', 25).style('fill', '#97B3CB');
    this.legend.append('text').attr('x', 40).attr('y', 12).text('Nombre de but').style('font-size', '15px').attr('alignment-baseline', 'middle');
    this.legend.append('text').attr('x', 40).attr('y', 52).text('Nombre d’assists').style('font-size', '15px').attr('alignment-baseline', 'middle');
    this.legend.append('text').attr('x', 0).attr('y', -24).text('Légende').style('font-size', '17px').attr('alignment-baseline', 'middle');
    this.legend.attr('transform', `translate(600,650)`);
  }

  private generateBarChartFeedback(g: any) {
    g.selectAll('#bar')
      .selectAll('.rect-container')
      .on('mouseenter', (e: any, d: any) => {
        selectTicks(d.data.Player, e.target);
      })
      .on('mouseleave', function () {
        unselectTicks();
      });
  }

  private generateStackedBarChart(g: any) {
    if (!this.firstCategorie) {
      // Show the stacked bars
      g.append('g')
        .attr('class', 'stacked')
        .attr('id', 'stacked')
        .selectAll('g')
        // Enter in the stack data = loop key per key = group per group
        .data(this.stackedData)
        .enter()
        .append('g')
        .attr('class', 'bar')
        .attr('id', 'bar')
        .attr('fill', (d: { key: string }) => {
          return this.color(d.key);
        })
        .selectAll('g')
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function (d: any) {
          return d;
        })
        .enter()
        .append('g')
        .attr('class', 'rect-container')
        .attr('id', 'rect-container')
        .append('rect')
        .attr('overflow', 'visible')
        .attr('y', (d: { data: { Player: string } }) =>
          this.yScale(d.data.Player)
        )
        .attr('x', (d: d3.NumberValue[]) => this.xScale(d[0]))
        .on('mouseover', this.tipCad.show)
        .on('mouseout', this.tipCad.hide)
        .on('mouseleave', this.tipCad.leave)
        .attr('height', this.yScale.bandwidth())
        .attr('width', (_d: any) => 0)
        .transition()
        .duration(800)
        .attr('width', (d: any) => this.xScale(d[1]) - this.xScale(d[0]));

      // Show text header
      g.append('text')
        .attr('y', -50)
        .text(`${this.headers[1]}`)
        .attr('class', 'title-viz2');
    } else {
      // Show the stacked bars
      g.append('g')
        .attr('class', 'stacked')
        .attr('id', 'stacked')
        .selectAll('g')
        // Enter in the stack data = loop key per key = group per group
        .data(this.stackedData)
        .enter()
        .append('g')
        .attr('class', 'bar')
        .attr('id', 'bar')
        .attr('fill', (d: { key: string }) => {
          return this.color(d.key);
        })

        .selectAll('g')
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function (d: any) {
          return d;
        })
        .enter()
        .append('g')
        .attr('class', 'rect-container')
        .attr('id', 'rect-container')
        .append('rect')
        .attr('overflow', 'visible')
        .attr('y', (d: { data: { Player: string } }) =>
          this.yScale(d.data.Player)
        )
        .attr('x', (d: d3.NumberValue[]) => this.xScale(d[0]))
        .on('mouseover', this.tipConcacaf.show)
        .on('mouseout', this.tipConcacaf.hide)
        .on('mouseleave', this.tipConcacaf.leave)
        .attr('height', this.yScale.bandwidth())
        .attr('width', (_d: any) => 0)
        .transition()
        .duration(800)
        .attr('width', (d: any) => this.xScale(d[1]) - this.xScale(d[0]));

      // Show text header
      g.append('text')
        .attr('y', -50)
        .text(`${this.headers[0]}`)
        .attr('class', 'title-viz2');
    }
  }

  get firstCategorie() {
    return this.actualCat == this.categories[0];
  }
}

function selectTicks(name: any, element: any) {
  // Met en gras le text Y Axis
  d3.select('#vis2-g')
    .select('.yAxis')
    .selectAll('.tick')
    .selectAll('text')
    .filter(function () {
      return d3.select(this).text() === name;
    })
    .style('font-weight', 'bold');

  // Met en gras le rect
  d3.select(element)
    .attr('stroke', '#232323')
    .attr('stroke-width', '3')
    .attr('stroke-linejoin', 'round');
}

function unselectTicks() {
  // Reset feedback
  d3.select('#vis2-g').select('.yAxis').selectAll('.tick').selectAll('text').style('font-weight', 'normal');
  d3.select('#vis2-g').select('.stacked').selectAll('.bar').selectAll('.rect-container').attr('stroke-width', '0');
}
