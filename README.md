# nr1-ingest-metric-script  <br>
create custom metric via synthetic script to capture New Relic One ingest


## tl;dr
Use this script to set up a synthetic monitor that:
  1. Queries ingestion by data source, faceted by the attribute of your choice (e.g., `APM Events` by `appName`)
  2. Transforms the output into a metric that is pushed to the Metric API
  3. Can be queried for consumption analysis / dashboards for 13 months


## objective
Consumption-based pricing has motivated New Relic users to analyze data ingest more closely and identify opportunities to optimize; i.e., help me understand:
> What are we sending?<br>
> Is it valuable?<br>
> Are we sending more this month than we did last month?

Due to the 8-day default retention for event data, our users’ ability to understand ingest over periods longer than that is limited. For customers sending large volumes of a particular event, even querying the last 8 days may not be possible.

This script can be configured as a synthetic monitor to periodically query ingest and post it as a custom metric for longer storage, and thus, long-term querying and analysis.

Originally developed for MercadoLibre, a live instance of this script is querying and pushing `newrelic.ingest` metrics to `Demotron V2`. You can query this data by setting `metricName`=`'newrelic.ingest'`.

![image](https://user-images.githubusercontent.com/68360819/148800863-e10d8c8f-aeee-43bc-82bb-790a4131b98b.png)


The synthetic monitor itself is set up in the `New Relic TSS` account (RPM 1336182) under the name `ingestMetric- Demotron V2`.

## how to use
  1. _Required_ - Update the `QUERYKEY`, `INSERTAPIKEY`, and `ACCOUNTID` variables
  2. _Optional_ - Update the `HOURS` variable to set the time interval for the query (i.e., do you want to capture data ingestion for the past 1, 24, 168 hours?) - by default, this is set to 1
  3. _Optional_ - Update the faceted attribute used for each query (i.e., `FACET_METRICS`, `FACET_BROWSER`, `FACET_TRACING`, etc.). - by default, the value for `APM Events`, `Metrics`, `Browser Events`, `Tracing`, and `Mobile Events` is `appName`, for `Infrastructure Processes` and `Infrastructure Hosts` is `hostname`, for `Logging` is `labels.app`, for `Pixie` is `k8s.cluster.name`, and for `Networking Monitoring` is `instrumentation.name`
  5. _Optional_ - Update the `name` parameter within the metric payload - by default, this is set to `newrelic.ingest`

**Note**: You do not need to remove the queries for data types not present in the account - if the query returns an empty array, it will skip to the next query without printing the prior empty result.


## creating the monitor
Once you have updated the script according to your needs, create the monitor as follows:
  1. Select Endpoint availability (Scripted API)
  2. Name your monitor and configure the Period
  4. Select a location (any)
  5. Validate the script and confirm no errors
  6. Save the monitor
  7. Run test check and view data by querying
      ``FROM Metric SELECT * WHERE metricName='newrelic.ingest'``
  Filter on data types by using the `ingestType` attribute

**Note**: The Period you configure when setting up the script should match the value you set in the script’s `HOURS` variable - i.e., if the script is set to query ingest for the past hour (i.e., `HOURS` = 1), the script should run every hour so that the results also correspond to ingestion for the past hour.

## including custom events
You can also update the script to include any custom event(s) in your data ingestion metric. Within the `STATEMENTS` multi-dimensional array, add an additional array that includes 2 elements (delimited by commas):
  1. A query that returns data ingestion estimate for each custom event
  2. A label for the `ingestType`

For example:
``"SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”``

_Optional_ - If you want to facet on the custom event(s) as well, add this as the last element in the array and  define within the list of `VARIABLES` that third variable for the custom event’s faceted attribute (e.g., var `FACET_CUSTOMEVENTS` = `'payment.processor’`).

For example:<br>
``"SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”, FACET_CUSTOMEVENTS``


## dashboard
A dashboard for the custom metric is available in `dashboard.json`
![ingest-infrahosts](https://user-images.githubusercontent.com/68360819/151472717-39152e08-c9f3-4cf9-9517-a63b73a6643d.png)



## thank u
Andrew Lozoya for providing the original script to publish a custom event to the Event API<br>
Sam Chung for your troubleshooting genius


---

## open source license
This project is distributed under the Apache 2 license.

## support
New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the Explorers Hub where our community members collaborate on solutions and new ideas.

### community
Work with the Explorer's Hub team to create a tag for your app, then update the link below.

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

https://discuss.newrelic.com/t/quickstart-ingest-metric-script/179865

### issues / enhancement requests
Issues and enhancement requests can be submitted in the Issues tab of this repository. Please search for and review the existing open issues before submitting a new issue.

## contributing
Work with the Open Source Office to update the email alias below.

Contributions are encouraged! If you submit an enhancement request, we'll invite you to contribute the change yourself. Please review our Contributors Guide.

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+{{ APP_NAME }}@newrelic.com.
