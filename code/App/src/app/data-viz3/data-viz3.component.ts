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
  private width: number = Math.min(
    window.innerWidth - window.innerWidth / 4,
    1000
  );
  private legendId: String = '#vis3-legend-rect-ex';
  private widthPadding: number = 10;
  private height: number = Math.max(window.innerHeight, 900);
  private imSize: number = 30;
  private areaOutputRange: number = 70;
  private rows: number = 6;
  private cols: number = 6;
  private data: any[] = [];
  private legendData: any[] = [];
  private legendSizes: number[] = [1, 5, 15];
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
      d3.select('#vis3-svg')
        .selectAll(`.${this.categories[i].value}`)
        .data(this.data)
        .transition()
        .duration(1000)
        .call(svg => this.modifySquares(svg, i, '#vis3-svg'));
    }
    d3.select('#vis3-svg')
      .selectAll('.face')
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
      .call(svg =>
        svg.select('.positionNumber').text((d: any) => d['Index'] + 1)
      )
      .call(svg =>
        svg.select('.positionCircle').attr('fill', (d: any) => {
          let color =
            d['Index'] === 0
              ? '#D4AF37'
              : d['Index'] === 1
              ? '#C4CACE'
              : d['Index'] === 2
              ? '#A97142'
              : '#FFFAF2';
          return color;
        })
      );
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
      .range([this.widthPadding, this.width - this.widthPadding]);
    return x(index);
  }
  private yScale(index: number): any {
    const y: any = d3
      .scaleLinear()
      .domain([0, this.rows])
      .range([0, this.height]);
    return y(index);
  }

  private showTip(e: any, d: any, id: String): void {
    if (id !== this.legendId) {
      d3.select('#vis3-svg')
        .selectAll(`.${d['Player'].replace(' ', '')}`)
        .attr('stroke-width', 3)
        .attr('stroke', 'black');
    }
  }
  private hideTip(e: any, d: any): void {
    d3.selectAll(`.${d['Player'].replace(' ', '')}`).attr('stroke-width', 0);
  }

  private createMainSvg(): void {
    this.svg = d3
      .select('#vis3')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', 'vis3-svg');

    this.svg.call(this.tip);
  }

  private createLegend(): void {
    d3.select('#vis3-legend-rect')
      .append('g')
      .attr('id', this.legendId.toString().replace('#', ''))
      .attr('transform', 'translate(40,20)');
  }

  private modifyLegend(): void {
    d3.select(this.legendId.toString())
      .call(svg =>
        svg
          .append('text')
          .text('Classement')
          .attr('x', () => {
            return this.areaOutputRange;
          })
          .attr('y', () => {
            return this.areaOutputRange + this.imSize + this.imSize / 8;
          })
      )
      .call(svg =>
        svg
          .append('text')
          .text(this.categories[0].viewValue)
          .attr('x', () => {
            return -this.imSize;
          })
          .attr('y', () => {
            return this.imSize / 4;
          })
      )
      .call(svg =>
        svg
          .append('text')
          .text(this.categories[1].viewValue)
          .attr('x', () => {
            return this.imSize * 2.5;
          })
          .attr('y', () => {
            return this.imSize / 4;
          })
      )
      .call(svg =>
        svg
          .append('text')
          .text(this.categories[2].viewValue)
          .attr('x', () => {
            return -this.imSize;
          })
          .attr('y', () => {
            return this.areaOutputRange * 2 + this.imSize / 2;
          })
      );

    for (let i = 0; i < this.legendSizes.length; i++) {
      d3.select(this.legendId.toString())
        .call(svg =>
          svg
            .append('rect')
            .attr('x', this.areaOutputRange * 3 + this.imSize)
            .attr(
              'y',
              this.areaOutputRange * 2 - this.areaScale(this.legendSizes[i])
            )
            .attr('width', this.areaScale(this.legendSizes[i]))
            .attr('height', this.areaScale(this.legendSizes[i]))
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
        )
        .call(svg =>
          svg
            .append('text')
            .text(this.legendSizes[i])
            .attr('x', this.areaOutputRange * 3 + this.imSize + this.imSize / 8)
            .attr(
              'y',
              this.areaOutputRange * 2 -
                this.areaScale(this.legendSizes[i]) -
                this.imSize / 8
            )
        );
    }
    d3.select(this.legendId.toString())
      .append('text')
      .text('Échelle de grandeur')
      .attr('x', this.areaOutputRange * 3)
      .attr('y', this.imSize / 4);

    d3.select(this.legendId.toString())
      .selectAll('svg')
      .selectChildren()
      .on('mouseover', () => {});
    d3.select(this.legendId.toString())
      .select('.face')
      .selectChildren()
      .selectChildren()
      .on('mouseover', () => {});
  }

  private xSquareTranslation(
    id: String,
    d: any,
    i: number,
    isText = false
  ): number {
    let xValue: number = 0;
    if (id === '#vis3-svg') {
      xValue += this.xScale(d['Index'] % this.cols);
    }
    if (i !== 1) {
      xValue +=
        this.areaOutputRange -
        this.areaScale(d[this.categories[i].value]) -
        this.imSize / 4 +
        this.imSize / 8;
      if (isText) {
        xValue -= this.imSize;
      }
    } else {
      xValue += this.areaOutputRange - this.imSize / 8;
    }
    return xValue;
  }

  private ySquareTranslation(d: any, i: number, isText = false): number {
    let yValue: number = 0;
    if (i !== 2) {
      yValue +=
        this.yScale(Math.floor(d['Index'] / this.rows)) +
        this.areaOutputRange -
        this.areaScale(d[this.categories[i].value]);
      if (isText) {
        yValue -= this.imSize / 8;
      }
    } else {
      yValue +=
        this.yScale(Math.floor(d['Index'] / this.rows)) + this.areaOutputRange;
      if (isText) {
        yValue += this.areaOutputRange + this.imSize / 2;
      }
    }
    return yValue;
  }

  private modifySquares(svg: any, i: number, id: String) {
    svg
      .attr('width', (d: any) => {
        return this.areaScale(d[this.categories[i].value]);
      })
      .attr('height', (d: any) => {
        return this.areaScale(d[this.categories[i].value]);
      })
      .attr('fill', this.colors[i])
      .attr('x', (d: any) => {
        return this.xSquareTranslation(id, d, i);
      })
      .attr('y', (d: any) => {
        return this.ySquareTranslation(d, i);
      })
      .attr(
        'class',
        (d: any) =>
          this.categories[i].value + ' ' + d['Player'].replace(' ', '')
      );
  }

  private createSquares(id: String): void {
    const data: any = id === this.legendId ? this.legendData : this.data;
    for (let i = 0; i < this.categories.length; i++) {
      d3.select('#vis3')
        .select(`${id}`)
        .selectAll('g')
        .data(data)
        .enter()
        .append('svg')
        .on('mouseover', (e: any, d: any) => this.showTip(e, d, id))
        .on('mouseout', (e: any, d: any) => this.hideTip(e, d))
        .append('rect')
        .attr('class', (d: any) => d['Player'])
        .on('mouseover', this.tip.show)
        .on('mouseout', this.tip.hide)
        .call(svg => this.modifySquares(svg, i, id));
    }
  }

  private createCircles(id: String): void {
    const data: any = id === this.legendId ? this.legendData : this.data;
    d3.select(`${id}`)
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .on('mouseover', (e: any, d: any) => this.showTip(e, d, id))
      .on('mouseout', (e: any, d: any) => this.hideTip(e, d))
      .append('svg')
      .attr('class', 'face')
      .attr('overflow', 'visible')
      .attr('x', (d: any) => {
        let xValue: number = 0;
        if (id === '#vis3-svg') {
          xValue += this.xScale(d['Index'] % this.cols);
        }
        xValue += this.areaOutputRange - this.imSize / 2 - this.imSize / 8;
        return xValue;
      })
      .attr('y', (d: any) => {
        let yValue: number = 0;
        if (id === '#vis3-svg') {
          yValue += this.yScale(Math.floor(d['Index'] / this.rows));
        }
        yValue += this.areaOutputRange - this.imSize / 2;
        return yValue;
      })
      .call(svg =>
        svg
          .append('line')
          .attr('x1', this.imSize / 2)
          .attr('x2', this.imSize / 2)
          .attr(
            'y1',
            -this.imSize / 4 - this.imSize - this.imSize / 2 - this.imSize / 8
          )
          .attr(
            'y2',
            this.imSize / 4 +
              2 * this.imSize +
              this.imSize / 2 +
              this.imSize / 8
          )
          .attr('class', 'vis3-grid')
      )
      .call(svg =>
        svg
          .append('line')
          .attr('x1', -this.imSize * 2 - this.imSize / 4)
          .attr('x2', this.imSize * 2 + this.imSize + this.imSize / 4)
          .attr('y1', this.imSize / 2)
          .attr('y2', this.imSize / 2)
          .attr('class', 'vis3-grid')
      )
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
          .on('mouseover', this.tip.show)
          .on('mouseout', this.tip.hide)
      )
      .call(svg =>
        svg
          .append('circle')
          .attr('r', this.imSize / 4)
          .attr('cx', this.imSize)
          .attr('cy', this.imSize)
          .attr('fill', (d: any) => {
            let color =
              d['Index'] === 0
                ? '#D4AF37'
                : d['Index'] === 1
                ? '#C4CACE'
                : d['Index'] === 2
                ? '#A97142'
                : '#FFFAF2';
            return color;
          })
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

  private createSvg(): void {
    this.createMainSvg();
    this.createLegend();
    this.createSquares(this.legendId);
    this.createCircles(this.legendId);
    this.createSquares('#vis3-svg');
    this.createCircles('#vis3-svg');
    this.modifyLegend();
  }
}
