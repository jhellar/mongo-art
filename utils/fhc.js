const fh = require('fh-fhc');
const fs = require('fs');
const request = require('request');
const mute = require('mute');

let localTokens = {};
let rhmapHost;

function init(host, username, password) {
    var cfg = {
      loglevel: 'error',
      json: true,
      feedhenry: host,
      user: username,
      inmemoryconfig: true
    };
    rhmapHost = host;
  
    return new Promise(function(resolve, reject) {
      fh.load(cfg, function(err) {
        if (err) {
          return reject(err);
        }
  
        fh.target({_:[host]}, function(err) {
          if (err) {
            return reject(err);
          }
  
          fh.login({_:[username, password]}, function(err,loginTokens) {
            if (err) {
              return reject(err);
            }
            
            localTokens = loginTokens;
            return resolve({fhToken: loginTokens.login, csrf:loginTokens.csrf});
          });
        });
      });
    });
}

function appDeploy(appGuid, env, runtime) {
    return new Promise(function(resolve, reject) {
      const unmute = mute();
      const args = {
        app: appGuid,
        env,
        runtime: runtime,
        gitRef: {
          type: 'branch',
          value: 'master'
        }
      };
  
      fh.app.stage(args, function(error, startRes) {
        unmute();
  
        if (error) {
          return reject(error);
        }
  
        resolve(startRes);
      });
    });
}

function createProject(name, templateId) {
    return new Promise(function(resolve, reject){
        fh.projects.create({title: name, template: templateId, json: true},function(error, res){
            if (error) {
                return reject(error);
            }

            resolve(res);
        });
    });
}

function importAppZip(appName, projectId, zipApp, appType) {
    var headers = {
      'X-CSRF-Token': localTokens.csrf,
      'Cookie': `feedhenry_v=3; feedhenry=${localTokens.login}; csrf=${localTokens.csrf}`
    };
  
    var formData = {
      title: appName,
      templateType: appType,
      templateZipFile: fs.createReadStream(zipApp)
    };
  
    var options = {
      url: `${rhmapHost}/box/api/projects/${projectId}/apps`,
      method: 'POST',
      headers: headers,
      formData: formData
    };
  
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error || response.statusCode !== 201) {
          return reject(error ? error : `${response.statusCode}: ${response.statusMessage}`);
        }
  
        resolve(JSON.parse(body));
      });
    });
}

function importApp(projectId, title, type, repo, branch, env) {
  const data = {
    title: title,
    environment: { id: env },
    template: {
      type: type,
      repoUrl: repo,
      repoBranch: `refs/heads/${branch}`,
      imported: true
    }
  };

  return new Promise((resolve, reject) => {
    fh.call({
      url: `box/api/projects/${projectId}/apps`,
      method: 'POST',
      data: data
    }, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result.error);
    });
  });
}

function projectDelete(guid) {
  return new Promise(function(resolve, reject) {
    fh.projects.delete({project: guid, json: true}, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
}

function getCloudUrl(cloudAppId, environment) {
  return new Promise(function(resolve, reject) {
    fh.app.hosts({
      env: environment,
      app: cloudAppId
    },
    function(err,hosts) {
      if (err) {
        return reject(err);
      }
      return resolve(hosts.url);
    });
  });
}

function connectionsList(projectId) {
  return new Promise(function(resolve, reject) {
    fh.connections.list({project: projectId, json: true}, function(error, connections) {
      if (error) {
        return reject(error);
      }

      resolve(connections);
    });
  });
}

function createForm(formfile) {
  return new Promise((resolve, reject) => {
    fh.appforms.forms.create({ formfile }, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

function deployForm(id, environment) {
  return new Promise((resolve, reject) => {
    fh.appforms.environments.forms.deploy({id, environment}, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

function createFormTheme(themefile) {
  return new Promise((resolve, reject) => {
    fh.appforms.themes.create({themefile}, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

function associateFormWithProject(id, theme, forms) {
  return new Promise((resolve, reject) => {
    fh.appforms.projects.create({ id, theme, forms }, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

function deleteForm(id) {
  return new Promise((resolve, reject) => {
    fh.appforms.forms.delete({id}, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

function deleteFormTheme(id) {
  return new Promise((resolve, reject) => {
    fh.appforms.themes.delete({id}, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

module.exports = {
    init,
    createProject,
    appDeploy,
    importAppZip,
    importApp,
    projectDelete,
    getCloudUrl,
    connectionsList,
    createForm,
    deployForm,
    createFormTheme,
    associateFormWithProject,
    deleteForm,
    deleteFormTheme
};