<?php
/**
 * Created by PhpStorm.
 * User: wangzl
 * Date: 2019/8/7
 * Time: 18:46
 */

function dump(...$data) {
    ob_start();
    foreach ($data as $val) {
        if(is_array($val)) {
            var_dump($val);
        } else {
            print_r($val);
        }
        echo PHP_EOL;
    }
    $content = ob_get_contents();
    ob_end_clean();
    echo $content;
}
class tutu
{
    protected $dir = '';
    protected $is_show = false;
    public function __construct($is_show = false)
    {
        $this->is_show = $is_show;
        $this->dir = str_replace('\\', '/', __DIR__) . '/static/images/';
    }

    private function getNextImgName() {
        $list = scandir($this->dir);
        array_shift($list);
        array_shift($list);
        $k = 0;
        foreach ($list as $value) {
            if(strripos($value, '.') > 0) {
                $k ++;
            }
        }
        $name = $k + 1;
//        return md5($name) . '.jpg';
        return $name . '.jpg';
    }
    /**
     * 获取一张图片
     * @return string
     */
    public function first() {
        $count = 1;
        if($this->is_show) $this->info('准备爬'. $count . '张图片');
        $list = $this->getImageList($count);
        $filename = '';
        foreach ($list as $key => $item) {
            $filename = $this->dir . $this->getNextImgName();
            file_put_contents($filename, file_get_contents($item['url']));
            if($this->is_show) $this->info('写入成功:'. $filename. ',' . $item['url'] . '  ,lovePoint:'. $item['favorites']);
        }
        return str_replace($this->dir, '', $filename);
    }

    public function get($dir, $count = 10) {
        if(empty($count)) {
            $count = 100;
        }
        if($dir[strlen($dir) - 1] != '/') {
            $dir .= '/';
        }
        if(!is_dir($dir)) {
            $this->err($dir . '不存在');
        }
        if($this->is_show) $this->info('准备爬'. $count . '张图片');
        $list = $this->getImageList($count);
        $k = 1;
        foreach ($list as $key => $item) {
            $filename = $dir . $k . '.jpg';
            file_put_contents($filename, file_get_contents($item['url']));
            $this->info('写入成功:'. $filename. ',' . $item['url'] . '  ,lovePoint:'. $item['favorites']);
            $k ++;
        }
    }



    /**
     * 找到不重复的图片.
     * @param $count
     * @return array
     */
    private function getImageList($count) {
        static $list = [];
        for($i = 0; $i < $count; $i ++ ){
            $item = $this->getRandImage();
            $md5 = md5($item['url']);
            if(isset($list[$md5])) {
                $this->info('重复', $item['url']);
                return $this->getImageList($count);
            }
            $list[$md5] = $item;
            if($this->is_show) $this->info('已有:' . count($list) . '个数据');
            if(count($list) >= $count) {
                return $list;
            }
        }
        return $list;
    }

    private function getRandImage() {
        $tag = [
            '城市', '风光','人像', '纪实','旅行','街拍',
            '建筑', '女孩', '儿童', '植物', '景观',
            '树', '叶子', '海', '云', '海滩',
            '山', '人文',
            '色彩', '抓拍','情绪','日系','黑白',
            '可爱', '时尚', '写真','小清新', '艺术',
            '复古','微距',
            '手机', '胶片', '佳能', '尼康', '索尼',
            '富士', '35mm', '广角', '50mm',
        ];
        $idx = array_rand($tag);
        $name = urlencode($tag[$idx]);
        $url = sprintf('https://tuchong.com/rest/tags/%s/posts?page=1&count=50&order=weekly&before_timestamp=', $name);
        $json = file_get_contents($url);
        $data = json_decode($json, true);
        if(isset($data['postList'])) {
            $url_format = 'https://tuchong.pstatp.com/%s/f/%s.jpg';
            $love = [];
            foreach ($data['postList'] as $item) {
                if(!isset($item['images'][0]['img_id'])) {
                    continue;
                }
                $url = sprintf($url_format, $item['site_id'], $item['images'][0]['img_id']);
                $love[] = [
                    'url' => $url,
                    'favorites' => $item['favorites'],
                ];
            }
            array_multisort(array_column($love, 'favorites'), SORT_DESC, $love);
            $slice = array_slice($love, 0, 10);
            return $slice[array_rand($slice)];
        }
    }
    private function info(...$str) {
        foreach ($str as $v) {
            echo $v . PHP_EOL;
        }
    }
    private function err(...$str) {
        foreach ($str as $v) {
            echo $v . PHP_EOL;
        }
        exit();
    }
    public function setShow($is_show) {
        $this->is_show = $is_show;
    }
}

$params = $argv;
array_shift($params);
$tu = new tutu();
switch (count($params)) {
    case 1://first
        if($params[0] == 'first') {
            echo $tu->first();
        } else if($params[0] == 'test') {
            $tu->setShow(true);
        }
        break;
    case 2:
        break;
    case 3:
        break;
    default:
        echo 'err';
        break;
}