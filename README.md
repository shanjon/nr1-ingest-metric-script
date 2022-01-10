# nr1-ingest-metric-script  <br>
create custom metric via synthetic script to capture New Relic One ingest


## tl;dr
Use this script to set up a synthetic monitor that:
  1. Queries ingestion by data source, faceted by the attribute of your choice (e.g., `APM Events` by `appName`)
  2. Transforms the output into a metric that is pushed to the Metric API
  3. Can be queried for consumption analysis / dashboards for 13 months


## objective
Consumption-based pricing has motivated customers analyze NR1 data ingest and identify opportunities to optimize. It is now more important than ever to understand in which direction consumption is trending and why.

Due to the 8-day default retention for event data, our users’ ability to (analyze) ingest over periods longer than that is limited. For customers sending large volumes of a particular event, even querying the last 8 days may not be possible.

This script can be configured as a synthetic monitor to periodically query ingest and post it as a custom metric for longer storage, and thus, long-term querying and analysis.


## steps
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
If you want to include any custom event(s) in your data ingestion metric, you will need to incorporate the following into the script:
Within the `STATEMENTS` multi-dimensional array, add an additional array that includes 2 elements (delimited by commas):
A query that returns data ingestion estimate for each custom event.
A label for the `ingestType`

For example:<br>
``"SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”``

Optional - If you want to facet on the custom event(s) as well, add this as the last element in the array and  define within the list of VARIABLES that third variable for the custom event’s faceted attribute (e.g., var `FACET_CUSTOMEVENTS` = `'payment.processor’`).

For example:<br>
``"SELECT bytecountestimate()/10e8 FROM “Purchase” SINCE “ + HOURS + “ hours ago LIMIT MAX”, “Custom Events”, FACET_CUSTOMEVENTS``


## thank u

