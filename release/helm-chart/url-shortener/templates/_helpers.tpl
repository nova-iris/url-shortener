{{/*
Expand the name of the chart.
*/}}
{{- define "url-shortener.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "url-shortener.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "url-shortener.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "url-shortener.labels" -}}
helm.sh/chart: {{ include "url-shortener.chart" . }}
{{ include "url-shortener.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "url-shortener.selectorLabels" -}}
app.kubernetes.io/name: {{ include "url-shortener.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Server image helper function
*/}}
{{- define "url-shortener.serverImage" -}}
{{- if .Values.image.localImages -}}
{{ .Values.server.image.repository }}:{{ .Values.server.image.tag }}
{{- else -}}
{{ .Values.image.registry }}/{{ .Values.image.organization }}/{{ .Values.server.image.repository }}:{{ .Values.server.image.tag }}
{{- end -}}
{{- end -}}

{{/*
Client image helper function
*/}}
{{- define "url-shortener.clientImage" -}}
{{- if .Values.image.localImages -}}
{{ .Values.client.image.repository }}:{{ .Values.client.image.tag }}
{{- else -}}
{{ .Values.image.registry }}/{{ .Values.image.organization }}/{{ .Values.client.image.repository }}:{{ .Values.client.image.tag }}
{{- end -}}
{{- end -}}
