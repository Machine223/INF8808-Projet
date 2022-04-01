import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-data-viz3',
  templateUrl: './data-viz3.component.html',
  styleUrls: ['./data-viz3.component.css'],
})
export class DataViz3Component implements OnInit {
  private svg: any;
  private width: number = 800;
  private height: number = 800;
  private imSize: number = 30;
  private squarePadding: number = 60;
  private rows: number = 6;
  private cols: number = 6;
  private data: any[] = [];
  private colors: any[] = ['#df3251', ' #5cbbf0', '#8ae89f'];
  categories: any[] = [
    { value: 'Gls', viewValue: 'Buts' },
    { value: 'Ast', viewValue: 'Assits' },
    { value: 'MP', viewValue: 'Matchs' },
  ];
  selectedCategory: any;

  constructor() {}

  onSelect(): any {
    this.sortPlayers(this.selectedCategory);
    for (let i = 0; i < this.categories.length; i++) {
      d3.selectAll(`.${this.categories[i].value}`)
        .data(this.data)
        .transition()
        .duration(1000)
        .attr('width', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr('height', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr(
          'x',
          (d: any) =>
            this.xScale(d['Index'] % this.cols) + this.squarePadding * (i % 2)
        )
        .attr(
          'y',
          (d: any) =>
            this.yScale(Math.floor(d['Index'] / this.rows)) +
            this.squarePadding * Math.floor(i / 2)
        );
    }
    d3.selectAll('.face')
      .data(this.data)
      .transition()
      .duration(1000)
      .attr('x', (d: any) => {
        return this.xScale(d['Index'] % this.cols) + 30;
      })
      .attr('y', (d: any) => {
        return this.yScale(Math.floor(d['Index'] / this.rows)) + 30;
      });
  }

  ngOnInit(): void {
    d3.json('../../assets/data_vis3.json')
      .then((data: any) => {
        this.data = data;
        this.sortPlayers('MP');
      })
      .then(() => {
        this.createSvg();
      });
  }

  private sortPlayers(category: any): void {
    let newData = this.data.map(d => d);
    newData = newData.sort(function (
      firstPlayer: any,
      secondPlayer: any
    ): number {
      if (firstPlayer[category] < secondPlayer[category]) {
        return 1;
      } else {
        return -1;
      }
    });
    newData.map((d, i) => {
      const index = this.data.findIndex(x => x['Player'] === d['Player']);
      this.data[index]['Index'] = i;
    });
  }

  private areaScale(value: number): any {
    const area = d3
      .scaleSqrt()
      .domain([
        0,
        d3.max(this.data, function (d: any) {
          return d3.max([d['MP'], d['Gls'], d['Ast']]) || 0;
        }),
      ])
      .range([0, 50]);
    return area(value);
  }

  private xScale(index: number): any {
    const x: any = d3
      .scaleLinear()
      .domain([0, this.cols])
      .range([0, this.width]);
    return x(index);
  }
  private yScale(index: number): any {
    const y: any = d3
      .scaleLinear()
      .domain([0, this.rows])
      .range([0, this.height]);
    return y(index);
  }
  private createSvg(): void {
    this.svg = d3
      .select('#vis3')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', 'vis3-svg');

    for (let i = 0; i < this.categories.length; i++) {
      d3.select('#vis3-svg')
        .selectAll('g')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('width', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr('height', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr('fill', this.colors[i])
        .attr(
          'x',
          (d: any) =>
            this.xScale(d['Index'] % this.cols) + this.squarePadding * (i % 2)
        )
        .attr(
          'y',
          (d: any) =>
            this.yScale(Math.floor(d['Index'] / this.rows)) +
            this.squarePadding * Math.floor(i / 2)
        )
        .attr('class', this.categories[i].value);
    }

    d3.select('#vis3-svg')
      .selectAll('g')
      .data(this.data)
      .enter()
      .append('svg')
      .attr('class', 'face')
      .attr('x', (d: any) => {
        return this.xScale(d['Index'] % this.cols) + 30;
      })
      .attr('y', (d: any) => {
        return this.yScale(Math.floor(d['Index'] / this.rows)) + 30;
      })
      .append('image')
      .attr('xlink:href', (d: any) => {
        return d['Img'];
      })
      .attr('width', this.imSize)
      .attr('height', this.imSize);
  }
}
