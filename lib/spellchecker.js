var path = require('path');
var fs = require('fs');
var Promise = require('any-promise');
var bindings = require('../build/Release/spellchecker.node');

var Spellchecker = bindings.Spellchecker;

var checkSpellingAsyncCb = Spellchecker.prototype.checkSpellingAsync

Spellchecker.prototype.checkSpellingAsync = function (corpus) {
  return new Promise(function (resolve, reject) {
    checkSpellingAsyncCb.call(this, corpus, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  }.bind(this));
};

var defaultSpellcheck = null;

var ensureDefaultSpellCheck = function () {
  if (defaultSpellcheck) {
    return;
  }

  var lang = process.env.LANG;
  var dictPath = process.env.DICT_PATH || getDictionaryPath();
  lang = lang ? lang.split('.')[0] : 'en_US';
  defaultSpellcheck = new Spellchecker();

  setDictionary(lang, dictPath);
};

var setDictionary = function (lang, dictPath) {
  ensureDefaultSpellCheck();
  if (!fs.existsSync(path.join(dictPath, `${lang}.aff`)) || !fs.existsSync(path.join(dictPath, `${lang}.dic`))) {
    throw new Error(`No dictionary found in ${dictPath} for ${lang}`);
  }
  return defaultSpellcheck.setDictionary(process.platform==='darwin'?'':lang, dictPath);
};

var isMisspelled = function () {
  ensureDefaultSpellCheck();

  return defaultSpellcheck.isMisspelled.apply(defaultSpellcheck, arguments);
};

var checkSpelling = function () {
  ensureDefaultSpellCheck();

  return defaultSpellcheck.checkSpelling.apply(defaultSpellcheck, arguments);
};

var checkSpellingAsync = function (corpus) {
  ensureDefaultSpellCheck();

  return defaultSpellcheck.checkSpellingAsync.apply(defaultSpellcheck, arguments);
};

var add = function () {
  ensureDefaultSpellCheck();

  defaultSpellcheck.add.apply(defaultSpellcheck, arguments);
};

var remove = function () {
  ensureDefaultSpellCheck();

  defaultSpellcheck.remove.apply(defaultSpellcheck, arguments);
};

var getCorrectionsForMisspelling = function () {
  ensureDefaultSpellCheck();

  return defaultSpellcheck.getCorrectionsForMisspelling.apply(defaultSpellcheck, arguments);
};

var getAvailableDictionaries = function () {
  ensureDefaultSpellCheck();

  return defaultSpellcheck.getAvailableDictionaries.apply(defaultSpellcheck, arguments);
};

var getDictionaryPath = function () {
  var dict = path.join(__dirname, '..', 'vendor', 'hunspell_dictionaries');
  try {
    // HACK: Special case being in an asar archive
    var unpacked = dict.replace('.asar' + path.sep, '.asar.unpacked' + path.sep);
    if (require('fs').statSyncNoException(unpacked)) {
      dict = unpacked;
    }
  } catch (error) {
  }
  return dict;
}

module.exports = {
  setDictionary: setDictionary,
  add: add,
  remove: remove,
  isMisspelled: isMisspelled,
  checkSpelling: checkSpelling,
  checkSpellingAsync: checkSpellingAsync,
  getAvailableDictionaries: getAvailableDictionaries,
  getCorrectionsForMisspelling: getCorrectionsForMisspelling,
  getDictionaryPath: getDictionaryPath,
  Spellchecker: Spellchecker
};
