// วางที่ Assets/Plugins/WebGL/RabiesBridge.jslib
mergeInto(LibraryManager.library, {
  // ส่งผลด่านให้หน้าเว็บ (Next.js) เป็น JSON string
  SubmitResultToWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    if (window.RabiesBridge && window.RabiesBridge.submitResult) {
      window.RabiesBridge.submitResult(json);
    }
  },
  NotifyReadyToWeb: function () {
    if (window.RabiesBridge && window.RabiesBridge.ready) {
      window.RabiesBridge.ready();
    }
  }
});
