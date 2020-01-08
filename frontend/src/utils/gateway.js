import { apiGateway, glueGateway, s3Gateway, stsGateway } from "./request";

export default {
  deleteDataMapper(id) {
    return apiGateway(`data_mappers/${id}`, { method: "del" });
  },

  deleteQueueMatches(ids) {
    return apiGateway(`queue/matches`, {
      method: "del",
      data: {
        MatchIds: ids
      }
    })
  },

  enqueue(id, dataMappers) {
    return apiGateway(`queue`, {
      method: "patch",
      data: { MatchId: id, DataMappers: dataMappers }
    });
  },

  getAccountId() {
    return stsGateway("/?Action=GetCallerIdentity&Version=2011-06-15");
  },

  getDataMappers() {
    return apiGateway("data_mappers");
  },

  async getGlueDatabases() {
    const all = [];
    let watermark = undefined;
    while (true) {
      const body = watermark ? { NextToken: watermark } : {};
      const page = await glueGateway("GetDatabases", body);
      all.push(...page.DatabaseList);

      if (page.NextToken) watermark = page.NextToken;
      else break;
    }
    return { DatabaseList: all };
  },

  getGlueTable(database, table) {
    return glueGateway("GetTable", {
      DatabaseName: database,
      Name: table
    });
  },

  async getGlueTables(database) {
    const all = [];
    let watermark = undefined;
    while (true) {
      const body = Object.assign(watermark ? { NextToken: watermark } : {}, {
        DatabaseName: database
      });
      const page = await glueGateway("GetTables", body);
      all.push(...page.TableList);

      if (page.NextToken) watermark = page.NextToken;
      else break;
    }
    return { TableList: all };
  },

  getJob(jobId) {
    return apiGateway(`jobs/${jobId}`);
  },

  getLastJob() {
    return apiGateway(`jobs?page_size=1`);
  },

  async getJobs() {
    const allJobs = [];
    let watermark = undefined;

    while (true) {
      const qs = watermark ? `?start_at=${watermark}` : "";
      const page = await apiGateway(`jobs${qs}`);
      allJobs.push(...page.Jobs);

      if (page.NextStart) watermark = page.NextStart;
      else break;
    }
    return { Jobs: allJobs };
  },

  getObject(s3Path) {
    return s3Gateway(s3Path.replace("s3:/", ""));
  },

  getQueue() {
    return apiGateway("queue");
  },

  processQueue() {
    return apiGateway("queue", { method: "del" });
  },

  putDataMapper(id, db, table, columns) {
    return apiGateway(`data_mappers/${id}`, {
      method: "put",
      data: {
        DataMapperId: id,
        Columns: columns,
        QueryExecutor: "athena",
        QueryExecutorParameters: {
          DataCatalogProvider: "glue",
          Database: db,
          Table: table
        },
        Format: "parquet"
      }
    });
  }
};
