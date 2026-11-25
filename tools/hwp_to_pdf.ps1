# 조사설계실무요령 HWP → PDF (원문 쪽 보기용). 한컴오피스 한글이 설치된 윈도우 PC에서만 동작한다.
# 사용법: powershell -ExecutionPolicy Bypass -File tools\hwp_to_pdf.ps1 [-Only 제1편]
# - 원본 HWP는 열기만 하고 바꾸지 않는다(PDF로 '다른 이름으로 저장').
# - 한글 자동화 보안 모듈(FilePathCheckerModule)이 등록돼 있어야 파일 접근 확인 창이 뜨지 않는다.
param([string]$Only = '')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root '#참고자료\조사설계실무요령'
$out = Join-Path $src 'pdf'
New-Item -ItemType Directory -Force $out | Out-Null

$hwp = New-Object -ComObject HWPFrame.HwpObject
try {
    $ok = $hwp.RegisterModule('FilePathCheckDLL', 'FilePathCheckerModule')
    Write-Output "보안 모듈 등록: $ok"
    $hwp.XHwpWindows.Item(0).Visible = $false
    foreach ($f in Get-ChildItem $src -Filter '*.hwp' | Sort-Object Name) {
        if ($Only -and -not $f.Name.StartsWith($Only)) { continue }
        $pdf = Join-Path $out ($f.BaseName + '.pdf')
        $t = Get-Date
        if (-not $hwp.Open($f.FullName, 'HWP', 'forceopen:true;versionwarning:false')) { Write-Output "열기 실패: $($f.Name)"; continue }
        $pages = $hwp.PageCount
        $saved = $hwp.SaveAs($pdf, 'PDF', '')
        $hwp.Clear(1)   # 바꾼 것 없이 닫기
        $size = if (Test-Path $pdf) { [math]::Round((Get-Item $pdf).Length / 1MB, 1) } else { 0 }
        Write-Output ("{0}: {1}쪽 → {2} ({3} MB, 저장={4}, {5:N0}초)" -f $f.Name, $pages, (Split-Path -Leaf $pdf), $size, $saved, ((Get-Date) - $t).TotalSeconds)
    }
}
finally {
    $hwp.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($hwp)
}
