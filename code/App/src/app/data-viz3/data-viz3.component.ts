import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
//@ts-ignore
import d3Tip from 'd3-tip';

@Component({
  selector: 'app-data-viz3',
  templateUrl: './data-viz3.component.html',
  styleUrls: ['./data-viz3.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DataViz3Component implements OnInit {
  private svg: any;
  private width: number = window.innerWidth - window.innerWidth / 4;
  private height: number = window.innerHeight;
  private imSize: number = 30;
  private areaOutputRange: number = 70;
  private rows: number = 6;
  private cols: number = 6;
  private data: any[] = [];
  private legendData: any[] = [];
  private colors: any[] = ['#df3251', ' #5cbbf0', '#8ae89f'];
  tip = d3Tip()
    .attr('class', 'd3-tip')
    .html(function (e: any, d: any) {
      return `<p class='tooltip-title' style="margin-top: 0px">Joueur : <b>${d['Player']}</b></p>\
  <div class='tooltip-value'>Position : ${d['Pos']}</div>\
  <div class='tooltip-value'>Nombre de <span class="tooltip-gls">buts : ${d['Gls']}</span></div>\
  <div class='tooltip-value'>Nombre de <span class="tooltip-ast">passes décisives : ${d['Ast']}</span></div>\
  <div class='tooltip-value'>Nombre de <span class="tooltip-mp">parties jouées : ${d['MP']}</span></div>`;
    });
  categories: any[] = [
    { value: 'Gls', viewValue: 'Buts marqués' },
    { value: 'Ast', viewValue: 'Passes décisives' },
    { value: 'MP', viewValue: 'Parties jouées' },
  ];
  selectedCategory: any = this.categories[0].viewValue;

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
        .attr('x', (d: any) => {
          if (i !== 1) {
            return (
              this.xScale(d['Index'] % this.cols) +
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value]) -
              this.imSize / 4 +
              this.imSize / 8
            );
          } else {
            return (
              this.xScale(d['Index'] % this.cols) +
              this.areaOutputRange -
              this.imSize / 8
            );
          }
        })
        .attr('y', (d: any) => {
          if (i !== 2) {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value])
            );
          } else {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange
            );
          }
        });
    }
    d3.selectAll('.face')
      .data(this.data)
      .transition()
      .duration(1000)
      .attr('x', (d: any) => {
        return (
          this.xScale(d['Index'] % this.cols) +
          this.areaOutputRange -
          this.imSize / 2 -
          this.imSize / 8
        );
      })
      .attr('y', (d: any) => {
        return (
          this.yScale(Math.floor(d['Index'] / this.rows)) +
          this.areaOutputRange -
          this.imSize / 2
        );
      })
      .select('.positionNumber')
      .text((d: any) => d['Index'] + 1);
  }

  ngOnInit(): void {
    d3.json('../../assets/data_vis3.json')
      .then((data: any) => {
        this.data = data;
        this.legendData.push(
          this.data[this.data.findIndex(x => x['Player'] === 'Jonathan David')]
        );
        this.sortPlayers('Gls');
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
      .range([0, this.areaOutputRange]);
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

    this.svg.call(this.tip);

    d3.select('#vis3')
      .append('svg')
      .attr('transform', `translate(${this.width - 200},${-this.height - 150})`)
      .attr('width', 200)
      .attr('height', 200)
      .append('g')
      .attr('id', 'legend');
    for (let i = 0; i < this.categories.length; i++) {
      d3.select('#vis3')
        .select('#legend')
        .selectAll('g')
        .data(this.legendData)
        .enter()
        .append('rect')
        .attr('width', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr('height', (d: any) => {
          return this.areaScale(d[this.categories[i].value]);
        })
        .attr('fill', this.colors[i])
        .attr('x', (d: any) => {
          if (i !== 1) {
            return (
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value]) -
              this.imSize / 4 +
              this.imSize / 8
            );
          } else {
            return this.areaOutputRange - this.imSize / 8;
          }
        })
        .attr('y', (d: any) => {
          if (i !== 2) {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value])
            );
          } else {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange
            );
          }
        })
        .attr('class', this.categories[i].value);
    }
    d3.select('#legend')
      .selectAll('g')
      .data(this.legendData)
      .enter()
      .append('svg')
      .attr('class', 'face')
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide)
      .attr('overflow', 'visible')
      .attr('x', (d: any) => {
        return this.areaOutputRange - this.imSize / 2 - this.imSize / 8;
      })
      .attr('y', (d: any) => {
        return this.areaOutputRange - this.imSize / 2;
      })
      .call(svg =>
        svg
          .append('circle')
          .attr('r', this.imSize / 2 + this.imSize / 32)
          .attr('cx', this.imSize / 2)
          .attr('cy', this.imSize / 2)
          .attr('fill', 'none')
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('class', 'cir')
      )
      .call(svg =>
        svg
          .append('foreignObject')
          .attr('width', this.imSize)
          .attr('height', this.imSize)
          .append('xhtml:img')
          .attr('src', (d: any) => d['Img'])
          .attr('width', this.imSize)
          .attr('height', this.imSize)
      )
      .call(svg =>
        svg
          .append('circle')
          .attr('r', this.imSize / 4)
          .attr('cx', this.imSize)
          .attr('cy', this.imSize)
          .attr('fill', 'grey')
          .attr('stroke', 'black')
          .attr('stroke-width', 1)
          .attr('class', 'positionCircle')
      )
      .call(svg =>
        svg
          .append('text')
          .attr('x', this.imSize)
          .attr('y', this.imSize)
          .attr('text-anchor', 'middle')
          .attr('fill', 'black')
          .attr('dy', '.3em')
          .attr('class', 'positionNumber')
          .text((d: any) => d['Index'] + 1)
      );

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
        .attr('x', (d: any) => {
          if (i !== 1) {
            return (
              this.xScale(d['Index'] % this.cols) +
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value]) -
              this.imSize / 4 +
              this.imSize / 8
            );
          } else {
            return (
              this.xScale(d['Index'] % this.cols) +
              this.areaOutputRange -
              this.imSize / 8
            );
          }
        })
        .attr('y', (d: any) => {
          if (i !== 2) {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange -
              this.areaScale(d[this.categories[i].value])
            );
          } else {
            return (
              this.yScale(Math.floor(d['Index'] / this.rows)) +
              this.areaOutputRange
            );
          }
        })
        .attr('class', this.categories[i].value);
    }
    d3.select('#vis3-svg')
      .selectAll('g')
      .data(this.data)
      .enter()
      .append('svg')
      .attr('class', 'face')
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide)
      .attr('overflow', 'visible')
      .attr('x', (d: any) => {
        return (
          this.xScale(d['Index'] % this.cols) +
          this.areaOutputRange -
          this.imSize / 2 -
          this.imSize / 8
        );
      })
      .attr('y', (d: any) => {
        return (
          this.yScale(Math.floor(d['Index'] / this.rows)) +
          this.areaOutputRange -
          this.imSize / 2
        );
      })
      .call(svg =>
        svg
          .append('circle')
          .attr('r', this.imSize / 2 + this.imSize / 32)
          .attr('cx', this.imSize / 2)
          .attr('cy', this.imSize / 2)
          .attr('fill', 'none')
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('class', 'cir')
      )
      .call(svg =>
        svg
          .append('foreignObject')
          .attr('width', this.imSize)
          .attr('height', this.imSize)
          .append('xhtml:img')
          .attr('src', (d: any) => d['Img'])
          .attr('width', this.imSize)
          .attr('height', this.imSize)
      )
      .call(svg =>
        svg
          .append('circle')
          .attr('r', this.imSize / 4)
          .attr('cx', this.imSize)
          .attr('cy', this.imSize)
          .attr('fill', 'grey')
          .attr('stroke', 'black')
          .attr('stroke-width', 1)
          .attr('class', 'positionCircle')
      )
      .call(svg =>
        svg
          .append('text')
          .attr('x', this.imSize)
          .attr('y', this.imSize)
          .attr('text-anchor', 'middle')
          .attr('fill', 'black')
          .attr('dy', '.3em')
          .attr('class', 'positionNumber')
          .text((d: any) => d['Index'] + 1)
      );
  }
}
