var supercontext;
var deviceUUID;
var previewMode = false;
var productionMode = false;;

var widgetConfig = {
  chartMax: 100,
  chartMin: -50,
  fontSize: 11,
  innerRadius: 80
}

var data = {
  score: 0,
  gradingData: [
    {
      title: "Unsustainable",
      color: "#ee1f25",
      lowScore: -100,
      highScore: -20
    },
    {
      title: "Volatile",
      color: "#f04922",
      lowScore: -20,
      highScore: 0
    },
    {
      title: "Foundational",
      color: "#fdae19",
      lowScore: 0,
      highScore: 20
    },
    {
      title: "Developing",
      color: "#f3eb0c",
      lowScore: 20,
      highScore: 40
    },
    {
      title: "Maturing",
      color: "#b0d136",
      lowScore: 40,
      highScore: 60
    },
    {
      title: "Sustainable",
      color: "#54b947",
      lowScore: 60,
      highScore: 80
    },
    {
      title: "High Performing",
      color: "#0f9747",
      lowScore: 80,
      highScore: 100
    }
  ]
};

var sampleData = [
  [163434340, 99],
  [163434340, 8],
  [163434340, 57],
  [163434340, 22],
  [163434340, 69],
  [163434340, 41],
  [163434340, 15],
  [163434340, -25],
  [163434340, -40],
  [163434340, 33]
];

var vueInstance = new Vue({
  el: '#main',
  data: {
    widgetConfig: null,
    ranges: [],
    settings: null,
    score: 0,
    dataPoints: null,
    deviceUUID: null,
    chart: null,
    hand: null,
    label: null,
    label2: null,
    timestamp: null
  },
  watch: {
    dataPoints(newVal, oldVal) {
      console.log(newVal, oldVal)
      if (this.hand && !previewMode) {
        this.score = newVal[0][1]
        this.timestamp = new Date(newVal[0][0]).toString()
        this.hand.showValue(newVal[0][1], 1000, am4core.ease.cubicOut)
      }
    }
  },
  mounted() {

    this.$on("update", function (settings) {
      this.widgetConfig = widgetConfig;
      if (settings.chartCfg !== null) {
        this.ranges = settings.chartCfg
      } else {
        this.ranges = data.gradingData
      }
      if (settings.deviceId !== null && settings.metrics !== null && settings.timerange !== null) {
        this.settings = settings;
        this.getData(this.settings)
      } else {
        this.dataPoints = sampleData;
      }

      this.renderChart()
    })

    this.$on("updateData", function (timerange) {
      console.log(timerange)
      this.getNewData(timerange)
    })


  },

  methods: {
    renderChart() {

      var self = this
      am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        var chartMin = !previewMode ? self.settings.minValue : self.widgetConfig.chartMin;
        var chartMax = !previewMode ? self.settings.maxValue : self.widgetConfig.chartMax;

        console.log(self.widgetConfig.chartCfg)
        /**
        Grading Lookup
         */
        function lookUpGrade(lookupScore, grades) {
          // Only change code below this line
          for (var i = 0; i < grades.length; i++) {
            if (
              grades[i].lowScore < lookupScore &&
              grades[i].highScore >= lookupScore
            ) {
              return grades[i];
            }
          }
          return null;
        }

        // create chart
        var chart = am4core.create("chartdiv", am4charts.GaugeChart);
        chart.hiddenState.properties.opacity = 0;
        chart.fontSize = !previewMode ? self.settings.fontsize : self.widgetConfig.fontsize;
        chart.innerRadius = am4core.percent(!previewMode ? self.settings.innerRadius : self.widgetConfig.innerRadius);
        chart.resizable = true;

        /**
         * Normal axis
         */

        var axis = chart.xAxes.push(new am4charts.ValueAxis());
        axis.min = chartMin;
        axis.max = chartMax;
        axis.strictMinMax = true;
        axis.renderer.radius = am4core.percent(80);
        axis.renderer.inside = true;
        axis.renderer.line.strokeOpacity = 0.1;
        axis.renderer.ticks.template.disabled = false;
        axis.renderer.ticks.template.strokeOpacity = 1;
        axis.renderer.ticks.template.strokeWidth = 0.5;
        axis.renderer.ticks.template.length = 5;
        axis.renderer.grid.template.disabled = true;
        axis.renderer.labels.template.radius = am4core.percent(15);
        axis.renderer.labels.template.fontSize = "0.9em";

        /**
         * Axis for ranges
         */

        var axis2 = chart.xAxes.push(new am4charts.ValueAxis());
        axis2.min = chartMin;
        axis2.max = chartMax;
        axis2.strictMinMax = true;
        axis2.renderer.labels.template.disabled = true;
        axis2.renderer.ticks.template.disabled = true;
        axis2.renderer.grid.template.disabled = false;
        axis2.renderer.grid.template.opacity = 0.5;
        axis2.renderer.labels.template.bent = true;
        axis2.renderer.labels.template.fill = am4core.color("#000");
        axis2.renderer.labels.template.fontWeight = "bold";
        axis2.renderer.labels.template.fillOpacity = 0.3;



        /**
        Ranges
        */
        var ranges = self.ranges

        for (let grading of ranges) {
          var range = axis2.axisRanges.create();
          range.axisFill.fill = am4core.color(grading.color);
          range.axisFill.fillOpacity = 0.8;
          range.axisFill.zIndex = -1;
          range.value = grading.lowScore > chartMin ? grading.lowScore : chartMin;
          range.endValue = grading.highScore < chartMax ? grading.highScore : chartMax;
          range.grid.strokeOpacity = 0;
          range.stroke = am4core.color(grading.color).lighten(-0.1);
          range.label.inside = true;
          range.label.text = grading.title.toUpperCase();
          range.label.inside = true;
          range.label.location = 0.5;
          range.label.inside = true;
          range.label.radius = am4core.percent(10);
          range.label.paddingBottom = -5; // ~half font size
          range.label.fontSize = "0.9em";
        }

        var matchingGrade = lookUpGrade(self.score, ranges);

        /**
         * Label 1
         */

        var label = chart.radarContainer.createChild(am4core.Label);
        label.isMeasured = false;
        label.fontSize = "6em";
        label.x = am4core.percent(50);
        label.paddingBottom = 15;
        label.horizontalCenter = "middle";
        label.verticalCenter = "bottom";
        //label.dataItem = data;
        label.text = self.score;
        //label.text = "{score}";
        label.fill = am4core.color(matchingGrade.color);

        /**
         * Label 2
         */

        var label2 = chart.radarContainer.createChild(am4core.Label);
        label2.isMeasured = false;
        label2.fontSize = "2em";
        label2.horizontalCenter = "middle";
        label2.verticalCenter = "bottom";
        label2.text = matchingGrade.title.toUpperCase();
        label2.fill = am4core.color(matchingGrade.color);

        /**
        * Label 3
        */

        var label3 = chart.radarContainer.createChild(am4core.Label);
        label3.isMeasured = false;
        label3.fontSize = "1em";
        label3.horizontalCenter = "middle";
        label3.verticalCenter = "middle";
        label3.text = self.timestamp;
        label3.fill = am4core.color(matchingGrade.color);

        /**
         * Hand
         */

        var hand = chart.hands.push(new am4charts.ClockHand());
        hand.axis = axis2;
        hand.innerRadius = am4core.percent(55);
        hand.startWidth = 8;
        hand.pin.disabled = true;
        hand.value = self.score;
        hand.fill = am4core.color("#444");
        hand.stroke = am4core.color("#000");

        hand.events.on("positionchanged", function () {
          label.text = axis2.positionToValue(hand.currentPosition).toFixed(1);
          var value2 = axis.positionToValue(hand.currentPosition);
          var matchingGrade = lookUpGrade(self.score, ranges);
          label2.text = matchingGrade.title.toUpperCase();
          label2.fill = am4core.color(matchingGrade.color);
          label2.stroke = am4core.color(matchingGrade.color);
          label3.text = self.timestamp;
          label3.fill = am4core.color(matchingGrade.color);
          label3.stroke = am4core.color(matchingGrade.color);
          label.fill = am4core.color(matchingGrade.color);

        })


        if (previewMode) {
          var index = 0

          setInterval(function () {
            var value = self.dataPoints[index][1];
            self.score = value
            index += 1
            if (index === self.dataPoints.length) { index = 0 }
            hand.showValue(value, 1000, am4core.ease.cubicOut);
          }, 3000);
        }
        self.hand = hand
        self.chart = chart


      }); // end am4core.ready()
    },

    getData(settings) {
      console.log(settings)
      var query = {
        "metrics": [
          {
            "name": settings.metric,
            "limit": 1,
            "order": "desc",
            "tags": { "UUID": deviceUUID },
          }
        ],
        "start_absolute": settings.timerange.startTime,
        "end_absolute": settings.timerange.endTime
      }
      return fetch('/api/v2/timeseriesData', {
        method: "POST",
        processData: true,
        body: JSON.stringify(query),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then(function (response) { return response.json() })
        .then(res => {

          this.dataPoints = res.queries[0].results[0].values
          console.log(this.dataPoints)
        })


    },
    getNewData(timerange) {
      var query = {
        "metrics": [
          {
            "name": this.settings.metric,
            "limit": 1,
            "order": "desc",
            "tags": { "UUID": deviceUUID },

          }
        ],
        "start_absolute": timerange.startTime,
        "end_absolute": timerange.endTime
      }
      return fetch('/api/v2/timeseriesData', {
        method: "POST",
        processData: true,
        body: JSON.stringify(query),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then(function (response) { return response.json() })
        .then(res => {

          this.dataPoints = res.queries[0].results[0].values
          console.log(this.dataPoints)
        })


    }


  }

})

function connecthingWidgetInit(context) {
  productionMode = true
  context.filters.subscribe(handleFilterChange);
  supercontext = context;

  widgetUtils.loadWidgetSettings(function (err, widgetConfigData) {
    if (err === undefined || err === null) {
      if (widgetConfigData !== undefined) {
        console.log(vueInstance.$refs)
        console.log(widgetConfigData)
        if (widgetConfigData.deviceId != null) {
          deviceUUID = getDeviceById(widgetConfigData.deviceId)
        }
        vueInstance.$emit('update', widgetConfigData);
      }
    }
  });
}

function handleFilterChange(filters) {
  console.log(filters)

  deviceUUID = getDeviceById(filters.tags.deviceId[0])
  if (filters) {
    updateDeviceById(filters.tags.deviceId[0], function (err, data) {
      vueInstance.$emit('updateData', filters.timerange);
    })

  }
}

function getDeviceById(id) {
  $.ajax('/api/v1/devices/' + id, {
    cache: false,
    context: this,
    dataType: "json",
    method: "GET",
    processData: true,
    contentType: "application/json",
    error: function (xhr, status, err) {
      console.log('Error getting connecthingGetDevicesFromServer', err);
    },
    success: function (data, status, xhr) {
      console.log('Got list of devices from server:', data);

      return data.records[0].UUID
    }
  });
}
function updateDeviceById(id, callback) {
  $.ajax('/api/v1/devices/' + id, {
    cache: false,
    context: this,
    dataType: "json",
    method: "GET",
    processData: true,
    contentType: "application/json",
    error: function (xhr, status, err) {
      console.log('Error getting connecthingGetDevicesFromServer', err);
    },
    success: function (data, status, xhr) {
      console.log('Got list of devices from server:', data);
      if (data && data.records) {
        if (callback) {
          callback(null, data.records[0].UUID);
        }
      }
    }
  });
}

checkPreviewMode()

function checkPreviewMode() {
  setTimeout(function () {
    if (!productionMode) {
      previewMode = true;
      vueInstance.$emit('update', { deviceId: null, metrics: null, timerange: null, chartCfg: null });
    }
  }, 3000);
}