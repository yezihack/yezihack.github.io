```
lsof -p 18926 |wc -l
```

```

// curl 支持POST json
func CurlJsonPOST(uri, token string, params map[string]interface{}, timeout time.Duration) (result []byte, err error) {
	cli := &http.Client{
		Timeout: timeout,
	}
	data, err := json.Marshal(params)
	if err != nil {
		return
	}
	req, err := http.NewRequest(http.MethodPost, uri, bytes.NewBuffer(data))
	if err != nil {
		return
	}
	req.Header.Set("ACCESS-TOKEN", token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := cli.Do(req)
	if err != nil {
		return
	}
	// 必须关闭
	defer resp.Body.Close()
	result, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	return
}

// curl 支持POST form表单形式
func CurlFormPOST(uri, token string, params map[string]interface{}, timeout time.Duration) (result []byte, err error) {
	cli := &http.Client{
		Timeout: timeout,
	}
	values := url.Values{}
	for k, v := range params {
		if v != nil {
			values.Set(k, cast.ToString(v))
		}
	}
	req, err := http.NewRequest(http.MethodPost, uri, strings.NewReader(values.Encode()))
	if err != nil {
		return
	}
	req.Header.Set("ACCESS-TOKEN", token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := cli.Do(req)
	if err != nil {
		return
	}
	// 必须关闭
	defer resp.Body.Close()
	result, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	return
}
```

