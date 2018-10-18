import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DatasourceService } from '../datasource.service';
import { CommonService } from '../common.service';
import 'nvd3';

const defaultStats = [
  {
    label: "---------",
    value: "0"
  },
  {
    label: "---------",
    value: "0"
  },
  {
    label: "---------",
    value: "0"
  },
  {
    label: "---------",
    value: "0"
  }
]

const colorRange: any[] = [
  { key: "green1", val: "#1ac7c1" },
  { key: "red", val: "#f2726f" },
  { key: "grey", val: "#87c890" },
  { key: "black", val: "#313467" }
];

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit, AfterViewInit {

  histogramOptions;
  histogramData;
  AFOptions;
  AFData;
  handlingTimeOptions;
  handlingTimeData;
  postProcessingTimeData;
  postProcessingTimeOptions;
  height = 250;
  width = 200;
  dateFrom: string;
  dateTo: string;
  selectedDateFrom: string;
  selectedDateTo: string;
  isWorkOrderLoading: boolean;
  isAvgTimeLoading: boolean;

  statsPieChartData;
  statsPieChartOpts;
  isStatsLoading;

  basicStatsList = defaultStats;
  queryStatsList = defaultStats;

  constructor(private _activatedRoute: ActivatedRoute, private _datasource: DatasourceService, public _commonService: CommonService) {
    this._activatedRoute.params.subscribe((params) => {
      this._commonService.setContext(params['context']);
      this.initialize();
    });
  }
  ngOnInit() { 
    
  }

  ngAfterViewInit(){
    //setTimeout(() => {
      
      //(<HTMLElement>document.querySelectorAll('.nv-axisMaxMin-x')[0]).style.transform = "translate(380,0)";
      //(<HTMLElement>document.querySelectorAll('.nv-axisMaxMin-x')[1]).style.transform = "translate(0,0)";
      //filterBox.style.left = ""
    
    //}, 100);
  }

  fetchStats() {
    this.basicStatsList = defaultStats;
    this.queryStatsList = defaultStats;

    this.isStatsLoading = true;
    let dateFrom = this.selectedDateFrom
      ? this.formatClrDate(this.selectedDateFrom)
      : this._commonService.getToday();
    let dateTo = this.selectedDateTo
      ? this.formatClrDate(this.selectedDateTo)
      : this._commonService.getToday();

    this._datasource
      .fetchStats(this._commonService.getContext(), dateFrom, dateTo)
      .subscribe(data => {
        this.isStatsLoading = false;
        this.basicStatsList = data.total_summary.map(item => {
          if (typeof item.value == "number") {
            item.value = item.value.toLocaleString();
          }
          return item;
        });
        this.queryStatsList = data.status_summary.map(item => {
          if (typeof item.value == "number") {
            item.value = item.value.toLocaleString();
          }
          return item;
        });

        this.statsPieChartOpts = {
          chart: {
            type: "pieChart",
            height: this.height,
            x: function (d) {
              return d.key;
            },
            y: function (d) {
              return d.y;
            },
            showLabels: false,
            duration: 500,
            labelThreshold: 0.01,
            labelSunbeamLayout: true,
            legend: {
              margin: {
                top: 5,
                right: 70,
                bottom: 5,
                left: 0
              }
            },
            color: (d, i) => {
              var index = i >= colorRange.length ? i % colorRange.length : i;
              if (d.color) {
                let item = colorRange.find(item => (item.key = d.color));
                return item || colorRange[index].val;
              } else {
                return colorRange[index].val;
              }
            }
          }
        };

        var totalSuccess = 0,
          totalFailed = 0;
        data[0].status_summary.forEach(dt => {
          switch (dt.label.toLowerCase()) {
            case "completed":
              totalSuccess = dt.value;
              break;
            case "exceptions":
              totalFailed = dt.value;
              break;
          }
        });

        this.statsPieChartData = [
          {
            key: "Success",
            y: totalSuccess
          },
          {
            key: "Failure",
            y: totalFailed
          }
        ];
      });
  }

  initialize() {
    this.fetchStats();
    this.isAvgTimeLoading = this.isWorkOrderLoading = true;
    const dateFrom = (this.selectedDateFrom) ? this.formatClrDate(this.selectedDateFrom) : this._commonService.getToday();
    const dateTo = (this.selectedDateTo) ? this.formatClrDate(this.selectedDateTo) : this._commonService.getToday();


    this._datasource.getWorkOrderCreationStatus(this._commonService.getContext(), dateFrom, dateTo)
      .subscribe((data) => {
        // console.log(data);
        let m = -1;

        this.histogramData = [{
          'color': '#64A737', 'key': 'Completed', 'values': data.map((dt) => {
            const currDate = Object.keys(dt)[0];
            if (!dt[currDate].SUCCESS) {
              dt[currDate].SUCCESS = 0;
            }
            if (dt[currDate].SUCCESS > m) {
              m = dt[currDate].SUCCESS;
            }
            return { 'x': Date.parse((new Date(currDate)).toString()), 'y': dt[currDate].SUCCESS };
          })
        }, {
          'color': '#0078d2', 'key': 'Kick-out', 'values': data.map((dt) => {
            let currDate = Object.keys(dt)[0];
            if (!dt[currDate].PENDED) {
              dt[currDate].PENDED = 0;
            }
            if (dt[currDate].PENDED > m) {
              m = dt[currDate].PENDED;
            }
            return { 'x': Date.parse((new Date(currDate)).toString()), 'y': dt[currDate].PENDED };
          })
        }, {
          'color': '#fc9904', 'key': 'Failed', 'values': data.map((dt) => {
            let currDate = Object.keys(dt)[0];
            if (!dt[currDate].FAILED) {
              dt[currDate].FAILED = 0;
            }
            if (dt[currDate].FAILED > m) {
              m = dt[currDate].FAILED;
            }
            return { 'x': Date.parse((new Date(currDate)).toString()), 'y': dt[currDate].FAILED };
          })
        }, {
          'color': '#595959', 'key': 'In Process', 'values': data.map((dt) => {
            let currDate = Object.keys(dt)[0];
            if (!dt[currDate].INPROCESS) {
              dt[currDate].INPROCESS = 0;
            }
            if (dt[currDate]['INPROCESS'] > m) {
              m = dt[currDate]['INPROCESS'];
            }
            return { 'x': Date.parse((new Date(currDate)).toString()), 'y': dt[currDate]['INPROCESS'] };
          })
        }];

        this.histogramOptions = {
          chart: {
            type: 'stackedAreaChart',
            height: this.height,
            showControls: false,
            clipEdge: false,
            margin: {
              top: 80,
              right: 20,
              bottom: 45,
              left: 45
            },
            // width: this.width,
            duration: 300,
            stacked: true,
            useInteractiveGuideline: true,
            xAxis: {
              axisLabel: 'Processing date',
              showMaxMin: false,
              ticks: false,
              tickFormat: function (d) {
                const dt = (new Date(d)).toString().split(' ');
                return dt[1] + ' ' + dt[2];
              },
              autoSkip: false
            },
            reduceXTicks: false,
            yAxis: {
              axisLabel: 'Number of policies',
              axisLabelDistance: -15,
              tickFormat: function (d) {
                return '' + d;
              },
            }
          }
        };


        let chartType = 'lineChart', xDomain;
        if (data.length) {
          if (dateTo == dateFrom) {
            chartType = 'scatterChart';


            /* adjust date values*/
            let beforeDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) - 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let afterDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) + 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let newDateFrom = beforeDate(dateFrom);
            let newDateTo = afterDate(dateFrom);

            xDomain = [
              Date.parse((new Date(newDateTo + 'T00:00:01Z')).toString()),
              Date.parse((new Date(dateFrom + 'T00:00:01Z')).toString()),
              Date.parse((new Date(newDateFrom + 'T00:00:01Z')).toString())
              //Date.parse(this._commonService.adjustForTimezone(new Date(dateTo + 'T23:59:00Z')).toString())
            ];

            let dte = this.toClrDate(dateFrom);
            let tempAry = data[0][dte] || {};
            data[0] = {};
            data[0][dateFrom + 'T12:00:00Z'] = tempAry;
/*
            let temp = {};
              temp[dateFrom + 'T12:00:00Z'] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              data.unshift(temp);
              temp = {};
              temp[dateTo + 'T12:00:00Z'] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              data.push(temp);
*/
          } else if(dateTo != dateFrom && data.length==1){
            chartType = 'scatterChart';

             /* adjust date values*/
            /* let beforeDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) - 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let afterDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) + 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let newDateFrom = beforeDate(dateFrom);
            let newDateTo = afterDate(dateFrom);*/

            xDomain = [
              Date.parse((new Date(dateTo)).toString()) + ((dateFrom == dateTo) ? 1 : 0),
              Date.parse((new Date(dateFrom)).toString())
            ];

              
          } else {

            /*if (data.length == 1) {
              let dt = Object.keys(data[0])[0];
              let temp = {};
              temp[this._commonService.addDate(new Date(dt), -1)] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              temp = {};
              temp[this._commonService.addDate(new Date(dt), 1)] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              data.push(temp);

              xDomain = [
                Date.parse(this._commonService.addDate(new Date(dt), -1).toString()),
                Date.parse(this._commonService.addDate(new Date(dt), 1).toString())
              ];
            } else {

            }*/
            xDomain = [
              Date.parse((new Date(dateFrom)).toString()),
              Date.parse((new Date(dateTo)).toString()) + ((dateFrom == dateTo) ? 1 : 0)
            ];
/*
            if (Object.keys(data[0])[0] != dateFrom) {
              let temp = {};
              temp[dateFrom] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              data.unshift(temp);
            }

            if (Object.keys(data[data.length - 1])[0] != dateTo) {
              let temp = {};
              temp[dateTo] = {
                'SUCCESS': 0,
                'PENDED': 0,
                'FAILED': 0,
                'INPROCESS': 0
              };
              data.push(temp);
            }
            */
          }

          // console.log(data);
        }

        let total = {};
        data.forEach((dt) => {
          let currDate = Object.keys(dt)[0];
          total[currDate] = dt[currDate].SUCCESS + dt[currDate].PENDED + dt[currDate].FAILED +
            dt[currDate].INPROCESS
        });

        this.AFData = [{
          area: true, 'color': 'rgb(0, 120, 210)', 'key': 'Processed', 'values':
            data.map((dt) => {
              let currDate = Object.keys(dt)[0];
              if (dt[currDate].SUCCESS > m) {
                m = dt[currDate].SUCCESS;
              }

              const total = dt[currDate].SUCCESS + dt[currDate].PENDED + dt[currDate].FAILED +
                dt[currDate].INPROCESS;
              return {
                'x': Date.parse((new Date(currDate)).toString()), 'y': total == 0 ? 0 : ((dt[currDate].SUCCESS + dt[currDate].PENDED) / total).toFixed(2)
              };
            })
        }];

        this.AFOptions = {
          chart: {
            type: chartType,
            height: this.height,
            // width: this.width,
            xDomain: xDomain,
            yDomain: [0, 1],
            showXAxis: true,
            showLegend: false,
            showControls: false,
            padData:true,
            padDataOuter: 0.1,
            clipEdge: false,
            margin: {
              top: 30,
              right: 20,
              bottom: 45,
              left: 45
            },
            x: function (d) { return d.x; },
            y: function (d) { return d.y; },
            // useInteractiveGuideline: true,
            duration: 300,
            xAxis: {
              showMaxMin:true,
              axisLabel: '',
              ticks: false,
              tickFormat: function (d) {
                const dt = (new Date(d)).toString().split(' ');
                return dt[1] + ' ' + dt[2];
              },
              autoSkip: false
            },
            reduceXTicks: true,
            yAxis: {
              axisLabel: 'Processed policy %',
              axisLabelDistance: -15,
              tickFormat: function (d) {
                return d3.format(',.0f')(d * 100) + '%';
              }

            }
          }
        };

        setTimeout(() => {
          this.isWorkOrderLoading = false;
        });
      });

    this._datasource.getAveragehandlingTime(this._commonService.getContext(), dateFrom, dateTo)
      .subscribe((data) => {

        /* let data = [];
        data =[
          {
            "start_time": "07/19/2018",
            "handling_time": -8.17647058823529
          },
          {
            "start_time": "07/21/2018",
            "handling_time": 0
          },
          {
            "start_time": "07/20/2018",
            "handling_time": -9.2
          }
        ]; */

        let m = 0;
        let chartType = 'lineChart', xDomain;

        //let data;
        //data = { '08/27/2018': { 'COMPLETED': 16, 'KICKOUT': 15, 'AVERAGE': 15 }, '08/29/2018': { 'KICKOUT': 12, 'COMPLETED': 18, 'AVERAGE': 104 }, '08/31/2018': { 'COMPLETED': 14, 'KICKOUT': 18, 'AVERAGE': 12 }, '09/03/2018': { 'KICKOUT': 2, 'AVERAGE': 1 }, '09/04/2018': { 'KICKOUT': 21, 'COMPLETED': 16, 'AVERAGE': 164 } };


        data = Object.keys(data).map((dt) => {
          data[dt]['start_time'] = dt;
          ['COMPLETED', 'KICKOUT', 'AVERAGE'].forEach(type => {
            if (!data[dt][type]) {
              data[dt][type] = 0;
            }
          });

          return data[dt];
        });



        if (data.length) {
          if (dateTo == dateFrom) {
            chartType = 'scatterChart';

            /* adjust date values*/
            let beforeDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) - 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let afterDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) + 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let newDateFrom = beforeDate(dateFrom);
            let newDateTo = afterDate(dateFrom);

            xDomain = [
              Date.parse((new Date(newDateTo + 'T00:00:01Z')).toString()),
              Date.parse((new Date(dateFrom + 'T00:00:01Z')).toString()), 
              Date.parse((new Date(dateFrom + 'T00:00:01Z')).toString()),
              //Date.parse((new Date(dateTo + 'T23:59:00Z')).toString())
              Date.parse((new Date(newDateFrom + 'T00:00:01Z')).toString())
            ];

            data[0] = {
              start_time: this.dateFrom,// + 'T12:00:00Z',
              //handling_time: data[0].handling_time
              COMPLETED: data[0].COMPLETED,
              KICKOUT: data[0].KICKOUT,
              AVERAGE: data[0].AVERAGE
            };

          } else if(dateTo != dateFrom && data.length==1){
            chartType = 'scatterChart';

             /* adjust date values*/
             let beforeDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) - 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let afterDate = function (date, status=true){
              let dt = date.toString().split('-');
              let reducer = Number(dt[2]) + 1
              console.log(dt[0] + "-" + dt[1] + "-" + reducer);
              return dt[0] + "-" + dt[1] + "-" + reducer;
            }
            let newDateFrom = beforeDate(dateFrom);
            let newDateTo = afterDate(dateFrom);

            xDomain = [
              Date.parse((new Date(dateTo)).toString()) + ((dateFrom == dateTo) ? 1 : 0),
              Date.parse((new Date(dateFrom)).toString())
              //Date.parse(this._commonService.adjustForTimezone(new Date(dateTo + 'T23:59:00Z')).toString())
            ];

          }
          else{

            xDomain = [
              
              Date.parse((new Date(dateFrom)).toString()),
              Date.parse((new Date(dateTo)).toString()) + ((dateFrom == dateTo) ? 1 : 0)
            ];
/*
            if (data[0].start_time != dateFrom) {
              data.unshift({
                start_time: this.dateFrom,
                //handling_time: 0
                COMPLETED: data[0].COMPLETED,
                KICKOUT: data[0].KICKOUT,
                AVERAGE: data[0].AVERAGE
              });
            }

            if (data[data.length - 1].start_time != dateTo) {
              data.push({
                start_time: this.dateTo,
                //handling_time: 0
                COMPLETED: data[0].COMPLETED,
                KICKOUT: data[0].KICKOUT,
                AVERAGE: data[0].AVERAGE
              });
            }
*/
          }

          this.handlingTimeData = [{
            'color': 'rgb(0, 120, 210)', 'key': 'Completed', 'values': data.map((row) => {
              return { 'x': Date.parse(this._commonService.adjustForTimezone(new Date(row.start_time)).toString()), 'y': row.COMPLETED };
            })
          }, {
            'color': '#ff0000', 'key': 'Average', 'values': data.map((row) => {
              return { 'x': Date.parse(this._commonService.adjustForTimezone(new Date(row.start_time)).toString()), 'y': row.AVERAGE };
            })
          }, {
            'color': '#595959', 'key': 'Kickout', 'values': data.map((row) => {
              return { 'x': Date.parse(this._commonService.adjustForTimezone(new Date(row.start_time)).toString()), 'y': row.KICKOUT };
            })
          }];


          m = this.handlingTimeData.map(row => {
            return row.values.reduce((acc, val) => {
              return acc.y > val.y ? acc : val;
            }).y;
          }).reduce((a, e) => {
            return Math.max(a, e);
          });


        } else {
          this.handlingTimeData = [];
        }
        // console.log(m);

        this.handlingTimeOptions = {
          chart: {
            type: chartType,
            height: this.height,
            // width: this.width,
            xDomain: xDomain,
            showXAxis: true,
            // yDomain: [0, Math.floor(m + 50)],
            showLegend: true,
            showControls: false,
            interpolate:"linear",
            padData:true,
            padDataOuter: 0.1,
            clipEdge: false,
            margin: {
              top: 30,
              right: 20,
              bottom: 45,
              left: 45
            },
            x: function (d) { return d.x; },
            y: function (d) { return d.y; },
            // useInteractiveGuideline: true,
            duration: 300,
            xAxis: {
              showMaxMin:true,
              ticks: false,
              axisLabel: '',
              tickFormat: function (d) {
                const dt = (new Date(d)).toString().split(' ');
                return dt[1] + ' ' + dt[2];
              },
              autoSkip: false
            },
            reduceXTicks: false,
            yAxis: {
              axisLabel: 'Handling Time (mins)',
              axisLabelDistance: -15,
              autoSkip: false
            },
            reduceYTicks: false,
          }
        };

        setTimeout(() => {
          this.isAvgTimeLoading = false;
        });

      });

    // this._datasource.getPostProcessingTime(this._commonService.getContext(), dateFrom, dateTo).subscribe((data) => {
    //   this.postProcessingTimeData = [{
    //     'color': 'rgb(252, 153, 4)', 'key': 'Post processing time', 'values': data.map((row) => {
    //       return { 'x': Date.parse(row.processing_date), 'y': row.avg };
    //     })
    //   }];

    //   const m = this.postProcessingTimeData[0]['values'].reduce((acc, val) => {
    //     return acc.y > val.y ? acc : val;
    //   }).y;
    //   this.postProcessingTimeOptions = {
    //     chart: {
    //       type: 'lineChart',
    //       height: this.height,
    //       yDomain: [0, m + 10],
    //       showLegend: false,
    //       showControls: false,
    //       margin: {
    //         top: 30,
    //         right: 20,
    //         bottom: 45,
    //         left: 45
    //       },
    //       x: function (d) { return d.x; },
    //       y: function (d) { return d.y; },
    //       useInteractiveGuideline: true,
    //       duration: 300,
    //       xAxis: {
    //         axisLabel: '',
    //         tickFormat: function (d) {
    //           const dt = (new Date(d)).toString().split(' ');
    //           return dt[1] + ' ' + dt[2];
    //         },
    //         autoSkip: false
    //       },
    //       reduceXTicks: false,
    //       yAxis: {
    //         axisLabel: 'Handling Time (min)',
    //         axisLabelDistance: -15
    //       },
    //     }
    //   };
    // });

  }

  onDateFromChange(val) {
    this.selectedDateFrom = val;
    if (this.validateDates()) {
      //console.log('refresh triggered');
      this.initialize();
    }
  }

  onDateToChange(val) {
    this.selectedDateTo = val;
    if (this.validateDates()) {
      //console.log('refresh triggered');
      this.initialize();
    }
  }

  formatClrDate(date) {
    let dateArr = date.split('/'),
      month = dateArr[0],
      day = dateArr[1],
      year = dateArr[2]
      ;
    return year + '-' + month + '-' + day;
  }

  toClrDate(date) {
    let dateArr = date.split('-'),
      year = dateArr[0],
      month = dateArr[1],
      day = dateArr[2]
      ;
    return month + '/' + day + '/' + year;
  }

  validateDates(): boolean {
    if (!this.selectedDateFrom || !this.selectedDateTo) {
      return false;
    }
    let fromDate = new Date(this.formatClrDate(this.selectedDateFrom));
    let toDate = new Date(this.formatClrDate(this.selectedDateTo));

    if (isNaN(toDate.valueOf()) || isNaN(fromDate.valueOf())) {
      //console.log('Invalid ' + toDate);
      return false;
    }

    if (fromDate > toDate) {
      let temp = this.selectedDateFrom;
      this.selectedDateFrom = this.dateFrom //= this.selectedDateTo;
      this.selectedDateTo = this.dateTo //= temp;
    }
    return true;
  }
}
