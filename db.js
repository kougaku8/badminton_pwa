// =====================================================
// 羽毛球报名系统 PWA
// 本地数据库 IndexedDB
// =====================================================

const DB_NAME = "badminton_pwa_db";
const DB_VERSION = 1;


// =====================================================
// 打开数据库
// =====================================================

function openDB() {

  return new Promise((resolve, reject) => {

    const request =
      indexedDB.open(DB_NAME, DB_VERSION);


    // 第一次创建数据库
    // 或以后升级数据库结构时执行
    request.onupgradeneeded = function(event) {

      const db = event.target.result;


      // 活动
      if (!db.objectStoreNames.contains("activities")) {

        const store =
          db.createObjectStore(
            "activities",
            { keyPath: "ActivityID" }
          );

        store.createIndex(
          "startTime",
          "StartTime",
          { unique: false }
        );

      }


      // 报名
      if (!db.objectStoreNames.contains("registrations")) {

        const store =
          db.createObjectStore(
            "registrations",
            { keyPath: "RegistrationID" }
          );

        store.createIndex(
          "activityId",
          "ActivityID",
          { unique: false }
        );

        store.createIndex(
          "contactValue",
          "ContactValue",
          { unique: false }
        );

      }


      // 签到
      if (!db.objectStoreNames.contains("checkins")) {

        const store =
          db.createObjectStore(
            "checkins",
            { keyPath: "CheckinID" }
          );

        store.createIndex(
          "activityId",
          "ActivityID",
          { unique: false }
        );

      }


      // 同步队列
      if (!db.objectStoreNames.contains("syncQueue")) {

        const store =
          db.createObjectStore(
            "syncQueue",
            {
              keyPath: "id",
              autoIncrement: true
            }
          );

        store.createIndex(
          "createdAt",
          "createdAt",
          { unique: false }
        );

      }


      // 用户本地信息
      if (!db.objectStoreNames.contains("user")) {

        db.createObjectStore(
          "user",
          { keyPath: "key" }
        );

      }


      // 系统设置
      if (!db.objectStoreNames.contains("settings")) {

        db.createObjectStore(
          "settings",
          { keyPath: "key" }
        );

      }

    };


    request.onsuccess = function(event) {

      resolve(event.target.result);

    };


    request.onerror = function(event) {

      reject(event.target.error);

    };

  });

}


// =====================================================
// 保存数据
// =====================================================

async function dbPut(storeName, data) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(storeName, "readwrite");

    const store =
      transaction.objectStore(storeName);

    const request =
      store.put(data);

    request.onsuccess = () => {

      resolve(request.result);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


// =====================================================
// 获取一条数据
// =====================================================

async function dbGet(storeName, key) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(storeName, "readonly");

    const store =
      transaction.objectStore(storeName);

    const request =
      store.get(key);

    request.onsuccess = () => {

      resolve(request.result);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


// =====================================================
// 获取一个 Store 的全部数据
// =====================================================

async function dbGetAll(storeName) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(storeName, "readonly");

    const store =
      transaction.objectStore(storeName);

    const request =
      store.getAll();

    request.onsuccess = () => {

      resolve(request.result);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


// =====================================================
// 删除数据
// =====================================================

async function dbDelete(storeName, key) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(storeName, "readwrite");

    const store =
      transaction.objectStore(storeName);

    const request =
      store.delete(key);

    request.onsuccess = () => {

      resolve(true);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


// =====================================================
// 清空 Store
// =====================================================

async function dbClear(storeName) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction =
      db.transaction(storeName, "readwrite");

    const store =
      transaction.objectStore(storeName);

    const request =
      store.clear();

    request.onsuccess = () => {

      resolve(true);

    };

    request.onerror = () => {

      reject(request.error);

    };

  });

}


// =====================================================
// 添加同步任务
// =====================================================

async function addSyncTask(task) {

  return dbPut(
    "syncQueue",
    {
      action: task.action,
      data: task.data,
      createdAt: new Date().toISOString(),
      retryCount: 0
    }
  );

}


// =====================================================
// 获取同步队列
// =====================================================

async function getSyncQueue() {

  return dbGetAll("syncQueue");

}


// =====================================================
// 删除同步任务
// =====================================================

async function removeSyncTask(id) {

  return dbDelete(
    "syncQueue",
    id
  );

}
