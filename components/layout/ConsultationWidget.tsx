"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string; // Track conversation context for follow-up questions
};

type KnowledgeBaseEntry = {
  keywords: string[];
  synonyms?: string[]; // Expanded synonym matching
  response: { [locale: string]: string };
  category?: string; // For context tracking
  followUp?: { [locale: string]: string }; // Suggested follow-up questions
};

const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    keywords: ["free plan", "free tier", "free plan features", "what is free"],
    response: {
      en: "Our **Free Plan** is perfect for getting started with EU AI Act compliance. It includes:\n\n- AI Literacy Resources (Art.4)\n- EU AI Act Knowledge Base\n- Art.6 Risk Classification\n- Multi-language Support (8 languages)\n- URL Compliance Scan (1x/month)\n\nNo credit card required. It's a great way to explore the platform before upgrading.",
      de: "Unser **Kostenloser Plan** ist ideal für den Einstieg in die EU AI Act Konformität. Er umfasst:\n\n- KI-Kompetenz-Ressourcen (Art.4)\n- EU AI Act Wissensdatenbank\n- Art.6 Risikoklassifizierung\n- Mehrsprachige Unterstützung (8 Sprachen)\n- URL-Konformitätsprüfung (1x/Monat)\n\nKeine Kreditkarte erforderlich.",
      fr: "Notre **Plan Gratuit** est parfait pour démarrer la conformité à l'AI Act européen. Il inclut :\n\n- Ressources de littératie IA (Art.4)\n- Base de connaissances AI Act européen\n- Classification des risques Art.6\n- Support multilingue (8 langues)\n- Analyse de conformité URL (1x/mois)\n\nAucune carte bancaire requise.",
      es: "Nuestro **Plan Gratis** es perfecto para comenzar con el cumplimiento del AI Act de la UE. Incluye:\n\n- Recursos de alfabetización en IA (Art.4)\n- Base de conocimientos del AI Act de la UE\n- Clasificación de riesgos Art.6\n- Soporte multilingue (8 idiomas)\n- Análisis de cumplimiento de URL (1x/mes)\n\nNo se requiere tarjeta de crédito.",
      it: "Il nostro **Piano Gratis** è perfetto per iniziare con la conformità all'AI Act dell'UE. Include:\n\n- Risorse di alfabetizzazione IA (Art.4)\n- Base di conoscenze AI Act dell'UE\n- Classificazione dei rischi Art.6\n- Supporto multilingue (8 lingue)\n- Scansione conformità URL (1x/mese)\n\nNessuna carta di credito richiesta.",
      zh: "我们的**免费计划**非常适合开始 EU AI Act 合规之旅。包含：\n\n- AI 素养资源 (Art.4)\n- EU AI Act 知识库\n- Art.6 风险分级\n- 多语言支持（8种语言）\n- URL 合规扫描（每月1次）\n\n无需信用卡。",
      ja: "当社の**無料プラン**は、EU AI Actコンプライアンスを始めるのに最適です。以下が含まれます：\n\n- AI リテラシーリソース (Art.4)\n- EU AI Act ナレッジベース\n- Art.6 リスク分類\n- 多言語サポート（8言語）\n- URL コンプライアンススキャン（月1回）\n\nクレジットカード不要。",
      ko: "당사의 **무료 플랜**은 EU AI Act 컴플라이언스를 시작하기에 완벽합니다. 다음이 포함됩니다:\n\n- AI 리터러시 리소스 (Art.4)\n- EU AI Act 지식 베이스\n- Art.6 리스크 분류\n- 다국어 지원 (8개 언어)\n- URL 컴플라이언스 스캔 (월 1회)\n\n신용카드 불필요.",
    },
  },
  {
    keywords: ["starter plan", "starter tier", "starter €39", "starter 39"],
    response: {
      en: "The **Starter Plan** at **€39/month** includes everything in Free, plus:\n\n- Prohibited AI Practices Check (Art.5)\n- Transparency Obligations (Art.50)\n- URL Compliance Scan (5x/month)\n- Document Templates\n- Compliance Score Report\n- Risk Level Determination\n- Industry Templates (Basic)\n\nIdeal for small businesses starting their compliance journey.",
      de: "Der **Starter-Plan** für **€39/Monat** enthält alles im Kostenlosen, plus:\n\n- Prüfung unzulässiger KI-Praktiken (Art.5)\n- Transparenzpflichten (Art.50)\n- URL-Konformitätsprüfung (5x/Monat)\n- Dokumentvorlagen\n- Konformitätspunktzahl-Bericht\n- Risikostufenbestimmung\n- Branchenvorlagen (Basis)\n\nIdeal für Kleinunternehmen.",
      fr: "Le **Plan Starter** à **39€/mois** inclut tout dans Gratuit, plus :\n\n- Vérification des pratiques interdites par l'IA (Art.5)\n- Obligations de transparence (Art.50)\n- Analyse de conformité URL (5x/mois)\n- Modèles de documents\n- Rapport de score de conformité\n- Détermination du niveau de risque\n- Modèles sectoriels (Basique)\n\nIdéal pour les petites entreprises.",
      es: "El **Plan Starter** por **€39/mes** incluye todo en Gratis, más:\n\n- Verificación de prácticas prohibidas por la IA (Art.5)\n- Obligaciones de transparencia (Art.50)\n- Análisis de cumplimiento de URL (5x/mes)\n- Plantillas de documentos\n- Informe de puntuación de cumplimiento\n- Determinación del nivel de riesgo\n- Plantillas por industria (Básico)\n\nIdeal para pequeñas empresas.",
      it: "Il **Piano Starter** a **€39/mese** include tutto in Gratis, più:\n\n- Verifica delle pratiche vietate dall'IA (Art.5)\n- Obblighi di trasparenza (Art.50)\n- Scansione conformità URL (5x/mese)\n- Modelli di documenti\n- Report del punteggio di conformità\n- Determinazione del livello di rischio\n- Modelli di settore (Base)\n\nIdeale per le piccole imprese.",
      zh: "**入门版计划**每月 **€39**，包含免费版所有功能，外加：\n\n- 禁止性 AI 实践检查 (Art.5)\n- 透明度义务 (Art.50)\n- URL 合规扫描（每月5次）\n- 文档模板\n- 合规评分报告\n- 风险等级判定\n- 行业模板（基础版）\n\n适合刚开始合规之旅的小型企业。",
      ja: "**スタータープラン**は**月額€39**で、無料プランのすべてに加えて以下が含まれます：\n\n- 禁止AI行為チェック (Art.5)\n- 透明性義務 (Art.50)\n- URL コンプライアンススキャン（月5回）\n- ドキュメントテンプレート\n- コンプライアンススコアレポート\n- リスクレベル判定\n- 業界テンプレート（基本）\n\n小規模企業に最適です。",
      ko: "**스타터 플랜**은 **월 €39**로, 무료 플랜의 모든 기능에 추가로 다음이 포함됩니다:\n\n- 금지 AI 관행 점검 (Art.5)\n- 투명성 의무 (Art.50)\n- URL 컴플라이언스 스캔 (월 5회)\n- 문서 템플릿\n- 컴플라이언스 점수 보고서\n- 리스크 수준 결정\n- 산업 템플릿 (기본)\n\n소기업에 이상적입니다.",
    },
  },
  {
    keywords: ["professional plan", "professional tier", "professional €89", "professional 89"],
    response: {
      en: "The **Professional Plan** at **€89/month** is our most popular option. It includes everything in Starter, plus:\n\n- Risk Management Framework\n- Data Governance (Art.10)\n- Technical Documentation (Annex IV)\n- Specialized Compliance Checks\n- FRIA Assessment (Art.27)\n- URL Compliance Scan (20x/month)\n- White-label Reports\n- Audit Logs\n- Multi-language Export\n- Conformity Assessment Guidance\n\nBest for growing companies needing comprehensive compliance tools.",
      de: "Der **Professional-Plan** für **€89/Monat** ist unsere beliebteste Option. Er enthält alles im Starter, plus:\n\n- Risikomanagement-Framework\n- Daten-Governance (Art.10)\n- Technische Dokumentation (Anhang IV)\n- Spezialisierte Konformitätsprüfungen\n- FRIA-Bewertung (Art.27)\n- URL-Konformitätsprüfung (20x/Monat)\n- White-Label-Berichte\n- Audit-Protokolle\n- Mehrsprachiger Export\n- Leitfaden zur Konformitätsbewertung\n\nIdeal für wachsende Unternehmen.",
      fr: "Le **Plan Professional** à **89€/mois** est notre option la plus populaire. Il inclut tout dans Starter, plus :\n\n- Cadre de gestion des risques\n- Gouvernance des données (Art.10)\n- Documentation technique (Annexe IV)\n- Vérifications spécialisées\n- Évaluation FRIA (Art.27)\n- Analyse URL (20x/mois)\n- Rapports en marque blanche\n- Journaux d'audit\n- Export multilingue\n- Guide d'évaluation de conformité\n\nMeilleur choix pour les entreprises en croissance.",
      es: "El **Plan Professional** por **€89/mes** es nuestra opción más popular. Incluye todo en Starter, más:\n\n- Marco de gestión de riesgos\n- Gobernanza de datos (Art.10)\n- Documentación técnica (Anexo IV)\n- Verificaciones especializadas\n- Evaluación FRIA (Art.27)\n- Análisis de URL (20x/mes)\n- Informes con marca blanca\n- Registros de auditoría\n- Exportación multilingue\n- Guía de evaluación de conformidad\n\nIdeal para empresas en crecimiento.",
      it: "Il **Piano Professional** a **€89/mese** è la nostra opzione più popolare. Include tutto in Starter, più:\n\n- Framework di gestione dei rischi\n- Governance dei dati (Art.10)\n- Documentazione tecnica (Allegato IV)\n- Verifiche specializzate\n- Valutazione FRIA (Art.27)\n- Scansione URL (20x/mese)\n- Report con marchio bianco\n- Registri di audit\n- Esportazione multilingue\n- Guida alla valutazione della conformità\n\nIdeale per aziende in crescita.",
      zh: "**专业版计划**每月 **€89**，是我们最受欢迎的选项。包含入门版所有功能，外加：\n\n- 风险管理框架\n- 数据治理 (Art.10)\n- 技术文档 (附件 IV)\n- 专项合规检查\n- FRIA 评估 (Art.27)\n- URL 合规扫描（每月20次）\n- 白标报告\n- 审计日志\n- 多语言导出\n- 合格评定指导\n\n最适合需要全面合规工具的成长型企业。",
      ja: "**プロフェッショナルプラン**は**月額€89**で、最も人気のオプションです。スタータープランのすべてに加えて以下が含まれます：\n\n- リスク管理フレームワーク\n- データガバナンス (Art.10)\n- 技術文書 (附属書 IV)\n- 専門コンプライアンスチェック\n- FRIA 評価 (Art.27)\n- URL スキャン（月20回）\n- ホワイトラベルレポート\n- 監査ログ\n- 多言語エクスポート\n- 適合性評価ガイダンス\n\n成長企業に最適です。",
      ko: "**프로페셔널 플랜**은 **월 €89**로 가장 인기 있는 옵션입니다. 스타터 플랜의 모든 기능에 추가로 다음이 포함됩니다:\n\n- 리스크 관리 프레임워크\n- 데이터 거버넌스 (Art.10)\n- 기술 문서 (부록 IV)\n- 전문 컴플라이언스 점검\n- FRIA 평가 (Art.27)\n- URL 스캔 (월 20회)\n- 화이트라벨 보고서\n- 감사 로그\n- 다국어 내보내기\n- 적합성 평가 가이드\n\n성장하는 기업에 가장 적합합니다.",
    },
  },
  {
    keywords: ["business plan", "business tier", "business €159", "business 159"],
    response: {
      en: "The **Business Plan** at **€159/month** is designed for organizations with advanced compliance needs. It includes everything in Professional, plus:\n\n- QMS Checklist (Art.17)\n- Deployer Obligations (Art.26)\n- Full FRIA Assessment\n- Advanced Compliance Tools\n- Automated Monthly Scans\n- Shadow AI Detection\n- Regulatory Change Alerts\n- Role-based Obligations\n- Full Industry Templates\n- Audit Chain & Evidence Pack\n\nPerfect for mid-sized companies and compliance teams.",
      de: "Der **Business-Plan** für **€159/Monat** ist für Organisationen mit erweiterten Konformitätsanforderungen konzipiert. Er enthält alles im Professional, plus:\n\n- QMS-Checkliste (Art.17)\n- Betreiberpflichten (Art.26)\n- Vollständige FRIA-Bewertung\n- Erweiterte Konformitätstools\n- Automatisierte monatliche Scans\n- Shadow AI-Erkennung\n- Regulatorische Änderungswarnungen\n- Rollenbasierte Pflichten\n- Vollständige Branchenvorlagen\n- Audit-Kette & Nachweis-Paket\n\nPerfekt für mittelständische Unternehmen.",
      fr: "Le **Plan Business** à **159€/mois** est conçu pour les organisations ayant des besoins avancés. Il inclut tout dans Professional, plus :\n\n- Liste de contrôle SMQ (Art.17)\n- Obligations du déployeur (Art.26)\n- Évaluation FRIA complète\n- Outils avancés\n- Analyses mensuelles automatisées\n- Détection IA fantôme\n- Alertes réglementaires\n- Obligations par rôle\n- Modèles sectoriels complets\n- Chaîne d'audit et dossier de preuves\n\nParfait pour les entreprises de taille moyenne.",
      es: "El **Plan Business** por **€159/mes** está diseñado para organizaciones con necesidades avanzadas. Incluye todo en Professional, más:\n\n- Lista de verificación SGC (Art.17)\n- Obligaciones del desplegador (Art.26)\n- Evaluación FRIA completa\n- Herramientas avanzadas\n- Análisis mensuales automatizados\n- Detección de IA sombra\n- Alertas regulatorias\n- Obligaciones basadas en roles\n- Plantillas por industria completas\n- Cadena de auditoría y paquete de evidencia\n\nPerfecto para empresas medianas.",
      it: "Il **Piano Business** a **€159/mese** è progettato per organizzazioni con esigenze avanzate. Include tutto in Professional, più:\n\n- Checklist SGQ (Art.17)\n- Obblighi del distributore (Art.26)\n- Valutazione FRIA completa\n- Strumenti avanzati\n- Scansioni mensili automatizzate\n- Rilevamento IA ombra\n- Avvisi normativi\n- Obblighi basati sui ruoli\n- Modelli di settore completi\n- Catena di audit e pacchetto di prove\n\nIdeale per aziende di medie dimensioni.",
      zh: "**商业版计划**每月 **€159**，专为有高级合规需求的组织设计。包含专业版所有功能，外加：\n\n- QMS 检查清单 (Art.17)\n- 部署者义务 (Art.26)\n- 完整 FRIA 评估\n- 高级合规工具\n- 自动月度扫描\n- 影子 AI 检测\n- 法规变更提醒\n- 基于角色的义务\n- 完整行业模板\n- 审计链与证据包\n\n适合中型企业和合规团队。",
      ja: "**ビジネスプラン**は**月額€159**で、高度なコンプライアンスニーズを持つ組織向けです。プロフェッショナルプランのすべてに加えて以下が含まれます：\n\n- QMS チェックリスト (Art.17)\n- デプロイヤー義務 (Art.26)\n- 完全な FRIA 評価\n- 高度なコンプライアンスツール\n- 自動月次スキャン\n- シャドウ AI 検出\n- 規制変更アラート\n- ロールベースの義務\n- フル業界テンプレート\n- 監査チェーンと証拠パッケージ\n\n中規模企業に最適です。",
      ko: "**비즈니스 플랜**은 **월 €159**로, 고급 컴플라이언스 요구사항이 있는 조직을 위해 설계되었습니다. 프로페셔널 플랜의 모든 기능에 추가로 다음이 포함됩니다:\n\n- QMS 체크리스트 (Art.17)\n- 배포자 의무 (Art.26)\n- 전체 FRIA 평가\n- 고급 컴플라이언스 도구\n- 자동 월간 스캔\n- 섀도우 AI 감지\n- 규제 변경 알림\n- 역할 기반 의무\n- 전체 산업 템플릿\n- 감사 체인 및 증거 패키지\n\n중견 기업에 적합합니다.",
    },
  },
  {
    keywords: ["enterprise plan", "enterprise tier", "enterprise €249", "enterprise 249"],
    response: {
      en: "The **Enterprise Plan** at **€249/month** is our comprehensive solution for large organizations. It includes everything in Business, plus:\n\n- GPAI Compliance (Art.51-56)\n- Unlimited AI Systems\n- Custom Compliance Checklists\n- Regulatory Change Push Notifications\n- API & Webhooks\n- Team Collaboration\n- GDPR Integration\n- Document Versioning\n- Dedicated Compliance Advisor\n- White-label Client Portal\n- Full Shadow AI Scan\n- Compliance Dashboard\n- AI Compliance Assistant\n- Training Module\n\nBest for enterprises requiring full-scale compliance management.",
      de: "Der **Enterprise-Plan** für **€249/Monat** ist unsere umfassende Lösung für große Organisationen. Er enthält alles im Business, plus:\n\n- GPAI-Konformität (Art.51-56)\n- Unbegrenzte KI-Systeme\n- Benutzerdefinierte Checklisten\n- Regulatorische Push-Benachrichtigungen\n- API & Webhooks\n- Teamzusammenarbeit\n- DSGVO-Integration\n- Dokumentenversionierung\n- Dedizierter Konformitätsberater\n- White-Label-Kundenportal\n- Vollständige Shadow AI-Prüfung\n- Konformitäts-Dashboard\n- KI-Konformitätsassistent\n- Schulungsmodul\n\nIdeal für Unternehmen mit umfassendem Konformitätsmanagement.",
      fr: "Le **Plan Enterprise** à **249€/mois** est notre solution complète. Il inclut tout dans Business, plus :\n\n- Conformité GPAI (Art.51-56)\n- Systèmes IA illimités\n- Listes de contrôle personnalisées\n- Notifications push réglementaires\n- API et Webhooks\n- Collaboration d'équipe\n- Intégration RGPD\n- Gestion des versions\n- Conseiller dédié\n- Portail client en marque blanche\n- Analyse complète IA fantôme\n- Tableau de bord\n- Assistant IA\n- Module de formation\n\nMeilleur pour les grandes organisations.",
      es: "El **Plan Enterprise** por **€249/mes** es nuestra solución integral. Incluye todo en Business, más:\n\n- Cumplimiento GPAI (Art.51-56)\n- Sistemas de IA ilimitados\n- Listas de verificación personalizadas\n- Notificaciones push regulatorias\n- API y Webhooks\n- Colaboración en equipo\n- Integración RGPD\n- Control de versiones\n- Asesor dedicado\n- Portal de cliente con marca blanca\n- Análisis completo de IA sombra\n- Panel de cumplimiento\n- Asistente IA\n- Módulo de formación\n\nMejor para grandes organizaciones.",
      it: "Il **Piano Enterprise** a **€249/mese** è la nostra soluzione completa. Include tutto in Business, più:\n\n- Conformità GPAI (Art.51-56)\n- Sistemi IA illimitati\n- Checklist personalizzate\n- Notifiche push normative\n- API e Webhook\n- Collaborazione di squadra\n- Integrazione GDPR\n- Versioning dei documenti\n- Consulente dedicato\n- Portale client con marchio bianco\n- Scansione IA ombra completa\n- Dashboard di conformità\n- Assistente IA\n- Modulo di formazione\n\nIdeale per grandi organizzazioni.",
      zh: "**企业版计划**每月 **€249**，是我们的综合解决方案。包含商业版所有功能，外加：\n\n- GPAI 合规 (Art.51-56)\n- 无限 AI 系统\n- 自定义合规检查清单\n- 法规变更推送通知\n- API 和 Webhooks\n- 团队协作\n- GDPR 集成\n- 文档版本控制\n- 专属合规顾问\n- 白标客户门户\n- 完整影子 AI 扫描\n- 合规仪表盘\n- AI 合规助手\n- 培训模块\n\n最适合需要全面合规管理的大型企业。",
      ja: "**エンタープライズプラン**は**月額€249**で、大規模組織向けの包括的ソリューションです。ビジネスプランのすべてに加えて以下が含まれます：\n\n- GPAI コンプライアンス (Art.51-56)\n- 無制限 AI システム\n- カスタムチェックリスト\n- 規制変更プッシュ通知\n- API と Webhooks\n- チームコラボレーション\n- GDPR 統合\n- ドキュメントバージョン管理\n- 専任アドバイザー\n- ホワイトラベルクライアントポータル\n- 完全シャドウ AI スキャン\n- コンプライアンスダッシュボード\n- AI アシスタント\n- トレーニングモジュール\n\n大企業に最適です。",
      ko: "**엔터프라이즈 플랜**은 **월 €249**로, 대규모 조직을 위한 종합 솔루션입니다. 비즈니스 플랜의 모든 기능에 추가로 다음이 포함됩니다:\n\n- GPAI 컴플라이언스 (Art.51-56)\n- 무제한 AI 시스템\n- 맞춤 컴플라이언스 체크리스트\n- 규제 변경 푸시 알림\n- API 및 Webhooks\n- 팀 협업\n- GDPR 통합\n- 문서 버전 관리\n- 전담 컴플라이언스 어드바이저\n- 화이트라벨 클라이언트 포털\n- 전체 섀도우 AI 스캔\n- 컴플라이언스 대시보드\n- AI 컴플라이언스 어시스턴트\n- 교육 모듈\n\n대기업에 가장 적합합니다.",
    },
  },
  {
    keywords: ["plan comparison", "compare plans", "which plan", "plan difference", "pricing", "all plans"],
    response: {
      en: "Here's a quick overview of all our plans:\n\n1. **Free** - €0/month: Basic Art.6 risk classification, knowledge base, 8-language support\n2. **Starter** - €39/month: + Art.5 prohibited AI practices, Art.50 transparency, document templates\n3. **Professional** - €89/month (Most Popular): + Risk management, technical docs (Annex IV), FRIA, audit logs\n4. **Business** - €159/month: + QMS, deployer obligations, shadow AI detection, automated scans\n5. **Enterprise** - €249/month: + GPAI compliance, unlimited systems, API/webhooks, team collaboration, white-label portal\n\nAll prices include EU VAT. You can upgrade or downgrade at any time. Visit our Pricing page for full details!",
      de: "Hier ist eine Übersicht aller Pläne:\n\n1. **Kostenlos** - €0/Monat: Basis Art.6 Risikoklassifizierung, Wissensdatenbank, 8 Sprachen\n2. **Starter** - €39/Monat: + Art.5 unzulässige KI-Praktiken, Art.50 Transparenz, Dokumentvorlagen\n3. **Professional** - €89/Monat (Beliebteste): + Risikomanagement, technische Dokumente, FRIA, Audit-Protokolle\n4. **Business** - €159/Monat: + QMS, Betreiberpflichten, Shadow AI, automatisierte Scans\n5. **Enterprise** - €249/Monat: + GPAI, unbegrenzte Systeme, API/Webhooks, Teamarbeit, White-Label-Portal\n\nAlle Preise inklusive EU-MwSt.",
      fr: "Voici un aperçu de tous nos forfaits :\n\n1. **Gratuit** - 0€/mois : Classification Art.6, base de connaissances, 8 langues\n2. **Starter** - 39€/mois : + Art.5 pratiques interdites par l'IA, Art.50, modèles de documents\n3. **Professional** - 89€/mois (Le plus populaire) : + Gestion des risques, docs techniques, FRIA\n4. **Business** - 159€/mois : + QMS, obligations déployeur, IA fantôme\n5. **Enterprise** - 249€/mois : + GPAI, systèmes illimités, API, collaboration\n\nTous les prix incluent la TVA européenne.",
      es: "Aquí tienes un resumen de todos nuestros planes:\n\n1. **Gratis** - €0/mes: Clasificación Art.6, base de conocimientos, 8 idiomas\n2. **Starter** - €39/mes: + Art.5, Art.50, plantillas\n3. **Professional** - €89/mes (Más popular): + Gestión de riesgos, docs técnicos, FRIA\n4. **Business** - €159/mes: + QMS, obligaciones, IA sombra\n5. **Enterprise** - €249/mes: + GPAI, ilimitado, API, colaboración\n\nTodos los precios incluyen IVA de la UE.",
      it: "Ecco una panoramica di tutti i nostri piani:\n\n1. **Gratis** - €0/mese: Classificazione Art.6, base di conoscenze, 8 lingue\n2. **Starter** - €39/mese: + Art.5, Art.50, modelli\n3. **Professional** - €89/mese (Più popolare): + Gestione rischi, documenti tecnici, FRIA\n4. **Business** - €159/mese: + QMS, obbligazioni distributore, IA ombra\n5. **Enterprise** - €249/mese: + GPAI, illimitato, API, collaborazione\n\nTutti i prezzi includono IVA UE.",
      zh: "以下是所有计划的快速概览：\n\n1. **免费版** - €0/月：基础 Art.6 风险分级、知识库、8种语言\n2. **入门版** - €39/月：+ Art.5 禁止性 AI 实践、Art.50 透明度、文档模板\n3. **专业版** - €89/月（最受欢迎）：+ 风险管理、技术文档、FRIA、审计日志\n4. **商业版** - €159/月：+ QMS、部署者义务、影子 AI 检测、自动扫描\n5. **企业版** - €249/月：+ GPAI 合规、无限系统、API/webhooks、团队协作、白标门户\n\n所有价格均含欧盟增值税。",
      ja: "すべてのプランの概要は以下の通りです：\n\n1. **無料** - €0/月：Art.6 リスク分類、ナレッジベース、8言語\n2. **スターター** - €39/月：+ Art.5、Art.50、テンプレート\n3. **プロフェッショナル** - €89/月（最人気）：+ リスク管理、技術文書、FRIA\n4. **ビジネス** - €159/月：+ QMS、デプロイヤー義務、シャドウ AI\n5. **エンタープライズ** - €249/月：+ GPAI、無制限、API、コラボレーション\n\nすべての価格に EU VAT が含まれます。",
      ko: "모든 플랜의 개요는 다음과 같습니다:\n\n1. **무료** - €0/월: Art.6 리스크 분류, 지식 베이스, 8개 언어\n2. **스타터** - €39/월: + Art.5, Art.50, 템플릿\n3. **프로페셔널** - €89/월 (가장 인기): + 리스크 관리, 기술 문서, FRIA\n4. **비즈니스** - €159/월: + QMS, 배포자 의무, 섀도우 AI\n5. **엔터프라이즈** - €249/월: + GPAI, 무제한, API, 협업\n\n모든 가격에 EU VAT가 포함됩니다.",
    },
  },
  {
    keywords: ["payment", "pay", "billing", "checkout", "lemon squeezy", "credit card", "how to pay"],
    response: {
      en: "We process payments securely through **Lemon Squeezy**, a trusted payment platform. Here's how to subscribe:\n\n1. Go to the **Pricing** page\n2. Click **Subscribe** on your desired plan\n3. You'll be redirected to a secure checkout page\n4. Enter your payment details (credit card, debit card, or other supported methods)\n5. Complete the purchase\n\nAll prices include EU VAT. You can manage your subscription, upgrade, or cancel anytime from your account settings. Invoices are generated automatically.",
      de: "Wir verarbeiten Zahlungen sicher über **Lemon Squeezy**. So abonnieren Sie:\n\n1. Gehen Sie zur **Preise**-Seite\n2. Klicken Sie auf **Abonnieren** bei Ihrem Wunschplan\n3. Sie werden zur sicheren Kassenseite weitergeleitet\n4. Geben Sie Ihre Zahlungsdetails ein\n5. Schließen Sie den Kauf ab\n\nAlle Preise inklusive EU-MwSt. Sie können Ihr Abonnement jederzeit verwalten.",
      fr: "Nous traitons les paiements via **Lemon Squeezy**. Voici comment souscrire :\n\n1. Allez sur la page **Tarifs**\n2. Cliquez sur **S'abonner** pour le forfait souhaité\n3. Vous serez redirigé vers une page de paiement sécurisée\n4. Entrez vos coordonnées de paiement\n5. Complétez l'achat\n\nTous les prix incluent la TVA européenne.",
      es: "Procesamos los pagos de forma segura a través de **Lemon Squeezy**. Así es como suscribirse:\n\n1. Vaya a la página de **Precios**\n2. Haga clic en **Suscribirse** en el plan deseado\n3. Será redirigido a una página de pago segura\n4. Ingrese sus datos de pago\n5. Complete la compra\n\nTodos los precios incluyen IVA de la UE.",
      it: "Elaboriamo i pagamenti in modo sicuro tramite **Lemon Squeezy**. Ecco come sottoscrivere:\n\n1. Vai alla pagina **Prezzi**\n2. Fai clic su **Abbonati** al piano desiderato\n3. Verrai reindirizzato a una pagina di pagamento sicura\n4. Inserisci i tuoi dati di pagamento\n5. Completa l'acquisto\n\nTutti i prezzi includono IVA UE.",
      zh: "我们通过 **Lemon Squeezy** 安全处理付款。订阅步骤如下：\n\n1. 前往**定价**页面\n2. 点击所需计划上的**订阅**按钮\n3. 您将被重定向到安全的结账页面\n4. 输入您的付款信息（信用卡、借记卡或其他支持的方式）\n5. 完成购买\n\n所有价格均含欧盟增值税。您可以随时管理订阅、升级或取消。",
      ja: "お支払いは**Lemon Squeezy**を通じて安全に処理されます。購読手順：\n\n1. **料金**ページに移動\n2. 希望プランの**購読する**をクリック\n3. 安全なチェックアウトページにリダイレクトされます\n4. お支払い情報を入力\n5. 購入を完了\n\nすべての価格に EU VAT が含まれます。",
      ko: "당사는 **Lemon Squeezy**를 통해 결제를 안전하게 처리합니다. 구독 방법:\n\n1. **가격** 페이지로 이동\n2. 원하는 플랜의 **구독하기**를 클릭\n3. 안전한 결제 페이지로 리디렉션됩니다\n4. 결제 정보 입력\n5. 구매 완료\n\n모든 가격에 EU VAT가 포함됩니다.",
    },
  },
  {
    keywords: ["risk assessment", "risk classification", "art.6", "art 6", "how to assess risk", "run risk"],
    response: {
      en: "To run a **Risk Assessment** (Art.6 Classification):\n\n1. Navigate to your **Dashboard**\n2. Click on **Risk Classification** in the Compliance Tools section\n3. Select or create an **AI System** entry\n4. Answer the self-assessment questionnaire about your AI system\n5. The tool will classify your system as High Risk, Limited Risk, or Minimal Risk\n6. Review the results with regulatory article references\n7. Save the results for your compliance records\n\nThe risk classification is based on EU AI Act Article 6 criteria. This feature is available on all plans, including Free.",
      de: "So führen Sie eine **Risikobewertung** (Art.6 Klassifizierung) durch:\n\n1. Gehen Sie zum **Dashboard**\n2. Klicken Sie auf **Risikoklassifizierung**\n3. Wählen oder erstellen Sie einen **KI-System**-Eintrag\n4. Beantworten Sie den Fragebogen\n5. Das Tool klassifiziert Ihr System\n6. Prüfen Sie die Ergebnisse\n7. Speichern Sie die Ergebnisse\n\nVerfügbar in allen Plänen, inklusive Kostenlos.",
      fr: "Pour effectuer une **Évaluation des risques** (Classification Art.6) :\n\n1. Accédez à votre **Tableau de bord**\n2. Cliquez sur **Classification des risques**\n3. Sélectionnez ou créez un **Système IA**\n4. Répondez au questionnaire\n5. L'outil classifie votre système\n6. Consultez les résultats\n7. Enregistrez les résultats\n\nDisponible sur tous les plans.",
      es: "Para realizar una **Evaluación de riesgos** (Clasificación Art.6):\n\n1. Vaya a su **Panel**\n2. Haga clic en **Clasificación de riesgos**\n3. Seleccione o cree un **Sistema de IA**\n4. Responda el cuestionario\n5. La herramienta clasificará su sistema\n6. Revise los resultados\n7. Guarde los resultados\n\nDisponible en todos los planes.",
      it: "Per eseguire una **Valutazione dei rischi** (Classificazione Art.6):\n\n1. Vai alla tua **Dashboard**\n2. Fai clic su **Classificazione dei rischi**\n3. Seleziona o crea un **Sistema IA**\n4. Rispondi al questionario\n5. Lo strumento classificherà il tuo sistema\n6. Rivedi i risultati\n7. Salva i risultati\n\nDisponibile su tutti i piani.",
      zh: "运行**风险评估**（Art.6 分级）的步骤：\n\n1. 前往您的**仪表盘**\n2. 点击合规工具区域的**风险分级**\n3. 选择或创建一个 **AI 系统**条目\n4. 回答关于您 AI 系统的自我评估问卷\n5. 工具会将您的系统分类为高风险、有限风险或最低风险\n6. 查看带有法规条款引用的结果\n7. 保存结果以备合规记录\n\n此功能在所有计划中均可用，包括免费版。",
      ja: "**リスク評価**（Art.6 分類）の実行方法：\n\n1. **ダッシュボード**に移動\n2. コンプライアンスツールの**リスク分類**をクリック\n3. **AI システム**を選択または作成\n4. 自己評価アンケートに回答\n5. ツールがシステムを分類します\n6. 結果を確認\n7. 結果を保存\n\nすべてのプランで利用可能です。",
      ko: "**리스크 평가**(Art.6 분류) 실행 방법:\n\n1. **대시보드**로 이동\n2. 컴플라이언스 도구에서 **리스크 분류** 클릭\n3. **AI 시스템** 선택 또는 생성\n4. 자체 평가 설문지에 답변\n5. 도구가 시스템을 분류합니다\n6. 결과 확인\n7. 결과 저장\n\n모든 플랜에서 사용 가능합니다.",
    },
  },
  {
    keywords: ["prohibited practices", "prohibited", "art.5", "art 5", "banned", "forbidden"],
    response: {
      en: "The **Prohibited AI Practices Check** (Art.5) helps you verify that your AI system doesn't violate any banned practices under the EU AI Act. This includes:\n\n- Social scoring by public authorities\n- Real-time remote biometric identification in public spaces\n- Manipulation of human behavior through subliminal techniques\n- Exploitation of vulnerabilities of specific groups\n- Emotion recognition in workplaces and educational institutions\n- Predictive policing based solely on profiling\n- Untargeted scraping of facial images\n\nTo use this tool, go to your Dashboard and click on **Prohibited AI Practices**. Available on the Starter plan and above.",
      de: "Die **Prüfung unzulässiger KI-Praktiken** (Art.5) hilft Ihnen zu überprüfen, ob Ihr KI-System keine verbotenen Praktiken verletzt.\n\nVerfügbar ab Starter-Plan.",
      fr: "La **Vérification des pratiques interdites par l'IA** (Art.5) vous aide à vérifier que votre système IA ne viole aucune pratique interdite.\n\nDisponible à partir du plan Starter.",
      es: "La **Verificación de prácticas prohibidas por la IA** (Art.5) le ayuda a verificar que su sistema de IA no viola ninguna práctica prohibida.\n\nDisponible desde el plan Starter.",
      it: "La **Verifica delle pratiche vietate dall'IA** (Art.5) aiuta a verificare che il sistema IA non violi pratiche vietate.\n\nDisponibile dal piano Starter.",
      zh: "**禁止性 AI 实践检查**（Art.5）帮助您验证 AI 系统是否违反了 EU AI Act 下的任何禁止性实践。包括：\n\n- 公共机构的社会评分\n- 公共场所的实时远程生物识别\n- 通过潜意识技术操纵人类行为\n- 利用特定群体的脆弱性\n- 工作场所和教育机构的情感识别\n- 仅基于画像的预测性执法\n- 非针对性的面部图像抓取\n\n前往仪表盘点击**禁止性 AI 实践**即可使用。入门版及以上计划可用。",
      ja: "**禁止AI行為チェック**（Art.5）は、AI システムが EU AI Act で禁止された行為に違反していないかを確認します。\n\nスタータープラン以上で利用可能です。",
      ko: "**금지 AI 관행 점검**(Art.5)은 AI 시스템이 EU AI Act에 따른 금지 관행을 위반하지 않는지 확인하는 데 도움을 줍니다.\n\n스타터 플랜 이상에서 사용 가능합니다.",
    },
  },
  {
    keywords: ["document generation", "generate document", "generate report", "download report", "export", "technical documentation"],
    response: {
      en: "To **generate compliance documents and reports**:\n\n1. Go to your **Dashboard**\n2. Select the AI system you want to document\n3. Choose the document type:\n   - Technical Documentation (Annex IV) - Professional+\n   - Risk Management Report - Professional+\n   - FRIA Assessment - Professional+\n   - Compliance Score Report - Starter+\n   - White-label Reports - Professional+\n4. Click **Generate** and wait for the document to be created\n5. **Download** or **Export** the document in your preferred format\n\nReports can be exported in multiple languages. The **One-Click Compliance Generator** on your dashboard can generate all required documents at once!",
      de: "So **generieren Sie Konformitätsdokumente und -berichte**:\n\n1. Gehen Sie zum **Dashboard**\n2. Wählen Sie das KI-System aus\n3. Wählen Sie den Dokumenttyp\n4. Klicken Sie auf **Generieren**\n5. **Laden Sie** das Dokument herunter oder **exportieren** Sie es\n\nDer **Ein-Klick-Generator** erstellt alle Dokumente auf einmal!",
      fr: "Pour **générer des documents et rapports de conformité** :\n\n1. Accédez à votre **Tableau de bord**\n2. Sélectionnez le système IA\n3. Choisissez le type de document\n4. Cliquez sur **Générer**\n5. **Téléchargez** ou **exportez** le document\n\nLe **Générateur en un clic** crée tous les documents d'un coup !",
      es: "Para **generar documentos y reportes de cumplimiento**:\n\n1. Vaya a su **Panel**\n2. Seleccione el sistema de IA\n3. Elija el tipo de documento\n4. Haga clic en **Generar**\n5. **Descargue** o **exporte** el documento\n\nEl **Generador con un clic** crea todos los documentos a la vez.",
      it: "Per **generare documenti e report di conformità**:\n\n1. Vai alla **Dashboard**\n2. Seleziona il sistema IA\n3. Scegli il tipo di documento\n4. Fai clic su **Genera**\n5. **Scarica** o **esporta** il documento\n\nIl **Generatore con un clic** crea tutti i documenti in una volta!",
      zh: "**生成合规文档和报告**的步骤：\n\n1. 前往您的**仪表盘**\n2. 选择要生成文档的 AI 系统\n3. 选择文档类型：\n   - 技术文档 (附件 IV) - 专业版及以上\n   - 风险管理报告 - 专业版及以上\n   - FRIA 评估 - 专业版及以上\n   - 合规评分报告 - 入门版及以上\n   - 白标报告 - 专业版及以上\n4. 点击**生成**，等待文档创建完成\n5. **下载**或**导出**您首选格式的文档\n\n报告可以导出为多种语言。仪表盘上的**一键合规生成器**可以一次性生成所有所需文档！",
      ja: "**コンプライアンス文書とレポートの生成**方法：\n\n1. **ダッシュボード**に移動\n2. AI システムを選択\n3. 文書タイプを選択\n4. **生成**をクリック\n5. **ダウンロード**または**エクスポート**\n\n**ワンクリック生成**ですべての文書を一括生成できます！",
      ko: "**컴플라이언스 문서 및 보고서 생성** 방법:\n\n1. **대시보드**로 이동\n2. AI 시스템 선택\n3. 문서 유형 선택\n4. **생성** 클릭\n5. **다운로드** 또는 **내보내기**\n\n**원클릭 생성기**로 모든 문서를 한 번에 생성할 수 있습니다!",
    },
  },
  {
    keywords: ["download", "save report", "export report", "pdf", "file format"],
    response: {
      en: "To **download compliance reports and documents**:\n\n1. Navigate to the tool or document you want to download\n2. After generation is complete, click the **Download** button\n3. Choose your preferred format (PDF, DOCX, etc.)\n4. The file will be saved to your device\n\nYou can also use the **Export** function to save reports in multiple languages. All downloads are tracked in your audit logs (Professional plan and above).",
      de: "So **laden Sie Konformitätsberichte herunter**:\n\n1. Navigieren Sie zum gewünschten Tool/Dokument\n2. Klicken Sie auf **Herunterladen**\n3. Wählen Sie das Format (PDF, DOCX, etc.)\n4. Die Datei wird gespeichert",
      fr: "Pour **télécharger des rapports de conformité** :\n\n1. Accédez à l'outil/document souhaité\n2. Cliquez sur **Télécharger**\n3. Choisissez le format (PDF, DOCX, etc.)\n4. Le fichier sera enregistré",
      es: "Para **descargar reportes de cumplimiento**:\n\n1. Navegue a la herramienta o documento deseado\n2. Haga clic en **Descargar**\n3. Elija el formato (PDF, DOCX, etc.)\n4. El archivo se guardará",
      it: "Per **scaricare report di conformità**:\n\n1. Accedi allo strumento/documento desiderato\n2. Fai clic su **Scarica**\n3. Scegli il formato (PDF, DOCX, ecc.)\n4. Il file verrà salvato",
      zh: "**下载合规报告和文档**的步骤：\n\n1. 导航到您想下载的工具或文档\n2. 生成完成后，点击**下载**按钮\n3. 选择您偏好的格式（PDF、DOCX 等）\n4. 文件将保存到您的设备\n\n您还可以使用**导出**功能以多种语言保存报告。所有下载都会记录在审计日志中（专业版及以上）。",
      ja: "**コンプライアンスレポートのダウンロード**方法：\n\n1. 目標のツール/文書に移動\n2. 生成完了後、**ダウンロード**をクリック\n3. 形式を選択（PDF、DOCX 等）\n4. ファイルが保存されます",
      ko: "**컴플라이언스 보고서 다운로드** 방법:\n\n1. 원하는 도구 또는 문서로 이동\n2. 생성 완료 후 **다운로드** 클릭\n3. 형식 선택 (PDF, DOCX 등)\n4. 파일이 저장됩니다",
    },
  },
  {
    keywords: ["eu ai act", "what is ai act", "ai regulation", "regulation", "compliance", "what is compliance"],
    response: {
      en: "The **EU AI Act** is the European Union's comprehensive regulatory framework for artificial intelligence. It establishes rules based on a risk-based approach:\n\n- **Unacceptable Risk** (Art.5): Prohibited AI practices\n- **High Risk** (Art.6-49): Strict requirements for high-risk AI systems\n- **Limited Risk** (Art.50): Transparency obligations\n- **Minimal Risk**: No specific requirements\n- **GPAI** (Art.51-56): Rules for general-purpose AI models\n\nOur platform helps you navigate every aspect of this regulation. Start with our Free plan to explore the basics!",
      de: "Der **EU AI Act** ist das umfassende regulatorische Rahmenwerk der EU für KI:\n\n- **Unannehmbares Risiko** (Art.5): Unzulässige KI-Praktiken\n- **Hohes Risiko** (Art.6-49): Strenge Anforderungen\n- **Begrenztes Risiko** (Art.50): Transparenzpflichten\n- **Minimales Risiko**: Keine spezifischen Anforderungen\n- **GPAI** (Art.51-56): Regeln für KI-Modelle allgemeiner Zweckbestimmung\n\nStarten Sie mit unserem Kostenlosen Plan!",
      fr: "L'**AI Act européen** est le cadre réglementaire complet de l'UE pour l'IA :\n\n- **Risque inacceptable** (Art.5) : Pratiques interdites par l'IA\n- **Risque élevé** (Art.6-49) : Exigences strictes\n- **Risque limité** (Art.50) : Obligations de transparence\n- **Risque minimal** : Pas d'exigences spécifiques\n- **GPAI** (Art.51-56) : Règles pour les modèles d'IA générale\n\nCommencez avec notre plan Gratuit !",
      es: "El **AI Act de la UE** es el marco regulatorio integral de la UE para la IA:\n\n- **Riesgo inaceptable** (Art.5): Prácticas prohibidas por la IA\n- **Alto riesgo** (Art.6-49): Requisitos estrictos\n- **Riesgo limitado** (Art.50): Obligaciones de transparencia\n- **Riesgo mínimo**: Sin requisitos específicos\n- **GPAI** (Art.51-56): Reglas para modelos de IA general\n\nComience con nuestro plan Gratis !",
      it: "L'**AI Act dell'UE** è il quadro normativo completo dell'UE per l'IA:\n\n- **Rischio inaccettabile** (Art.5): Pratiche vietate dall'IA\n- **Rischio elevato** (Art.6-49): Requisiti rigorosi\n- **Rischio limitato** (Art.50): Obblighi di trasparenza\n- **Rischio minimo**: Nessun requisito specifico\n- **GPAI** (Art.51-56): Regole per modelli IA generali\n\nIniziare con il nostro piano Gratis !",
      zh: "**EU AI Act** 是欧盟关于人工智能的综合监管框架。它基于风险分级方法建立规则：\n\n- **不可接受风险**（Art.5）：禁止的 AI 实践\n- **高风险**（Art.6-49）：高风险 AI 系统的严格要求\n- **有限风险**（Art.50）：透明度义务\n- **最低风险**：无特定要求\n- **GPAI**（Art.51-56）：通用 AI 模型的规则\n\n我们的平台帮助您应对该法规的各个方面。从免费计划开始探索基础知识！",
      ja: "**EU AI Act**は、EU の包括的な AI 規制フレームワークです：\n\n- **不適格リスク**（Art.5）：禁止AI行為\n- **高リスク**（Art.6-49）：厳格な要件\n- **限定リスク**（Art.50）：透明性義務\n- **最小リスク**：特定の要件なし\n- **GPAI**（Art.51-56）：汎用 AI モデルのルール\n\n無料プランから始めましょう！",
      ko: "**EU AI Act**는 EU의 포괄적인 AI 규제 프레임워크입니다:\n\n- **불가능한 위험**(Art.5): 금지 AI 관행\n- **고위험**(Art.6-49): 엄격한 요구사항\n- **제한적 위험**(Art.50): 투명성 의무\n- **최소 위험**: 특정 요구사항 없음\n- **GPAI**(Art.51-56): 범용 AI 모델 규칙\n\n무료 플랜으로 시작하세요!",
    },
  },
  {
    keywords: ["cancel", "unsubscribe", "cancel subscription", "stop payment", "refund"],
    response: {
      en: "You can **cancel your subscription** at any time:\n\n1. Go to **Account Settings**\n2. Navigate to **Subscription** or **Manage Subscription**\n3. Click **Cancel Subscription**\n4. Confirm the cancellation\n\nYour access will continue until the end of your current billing period. All your data and compliance records will be preserved even after cancellation.",
      de: "Sie können Ihr **Abonnement jederzeit kündigen**:\n\n1. Gehen Sie zu **Kontoeinstellungen**\n2. Navigieren Sie zu **Abonnement**\n3. Klicken Sie auf **Abonnement kündigen**\n4. Bestätigen Sie die Kündigung\n\nIhr Zugang bleibt bis zum Ende der aktuellen Abrechnungsperiode bestehen.",
      fr: "Vous pouvez **annuler votre abonnement** à tout moment :\n\n1. Allez dans **Paramètres du compte**\n2. Accédez à **Abonnement**\n3. Cliquez sur **Annuler l'abonnement**\n4. Confirmez l'annulation\n\nVotre accès continue jusqu'à la fin de la période de facturation.",
      es: "Puede **cancelar su suscripción** en cualquier momento:\n\n1. Vaya a **Configuración de la cuenta**\n2. Navegue a **Suscripción**\n3. Haga clic en **Cancelar suscripción**\n4. Confirme la cancelación\n\nSu acceso continuará hasta el final del período de facturación.",
      it: "Puoi **annullare il tuo abbonamento** in qualsiasi momento:\n\n1. Vai a **Impostazioni account**\n2. Vai a **Abbonamento**\n3. Fai clic su **Annulla abbonamento**\n4. Conferma l'annullamento\n\nIl tuo accesso continuerà fino alla fine del periodo di fatturazione.",
      zh: "您可以**随时取消订阅**：\n\n1. 前往**账户设置**\n2. 导航到**订阅**或**管理订阅**\n3. 点击**取消订阅**\n4. 确认取消\n\n您的访问权限将持续到当前计费周期结束。取消后，您的所有数据和合规记录都将保留。",
      ja: "**いつでもサブスクリプションをキャンセル**できます：\n\n1. **アカウント設定**に移動\n2. **サブスクリプション**に移動\n3. **キャンセル**をクリック\n4. 確認\n\n現在の請求期間の終了までアクセスが継続されます。",
      ko: "**언제든지 구독을 취소**할 수 있습니다:\n\n1. **계정 설정**으로 이동\n2. **구독**으로 이동\n3. **구독 취소** 클릭\n4. 확인\n\n현재 결제 기간이 끝날 때까지 접근 권한이 유지됩니다.",
    },
  },
  {
    keywords: ["upgrade", "change plan", "switch plan", "higher plan", "better plan"],
    response: {
      en: "To **upgrade your plan**:\n\n1. Go to **Dashboard** or **Account Settings**\n2. Click **Upgrade Plan** or **Manage Subscription**\n3. Select your desired new plan\n4. Complete the payment through Lemon Squeezy\n5. Your new features will be activated immediately\n\nWhen upgrading, you'll only pay the prorated difference for the remaining billing period. All your existing data is preserved.",
      de: "So **upgraden Sie Ihren Plan**:\n\n1. Gehen Sie zum **Dashboard** oder **Kontoeinstellungen**\n2. Klicken Sie auf **Plan upgraden**\n3. Wählen Sie den neuen Plan\n4. Schließen Sie die Zahlung ab\n5. Neue Funktionen werden sofort aktiviert\n\nAlle vorhandenen Daten bleiben erhalten.",
      fr: "Pour **mettre à niveau votre forfait** :\n\n1. Accédez au **Tableau de bord** ou **Paramètres**\n2. Cliquez sur **Mettre à niveau**\n3. Sélectionnez le nouveau forfait\n4. Effectuez le paiement\n5. Les nouvelles fonctionnalités sont activées immédiatement\n\nToutes vos données sont préservées.",
      es: "Para **mejorar su plan**:\n\n1. Vaya al **Panel** o **Configuración**\n2. Haga clic en **Mejorar plan**\n3. Seleccione el nuevo plan\n4. Complete el pago\n5. Las nuevas funciones se activarán inmediatamente\n\nTodos sus datos se conservan.",
      it: "Per **aggiornare il piano**:\n\n1. Vai alla **Dashboard** o **Impostazioni account**\n2. Fai clic su **Aggiorna piano**\n3. Seleziona il nuovo piano\n4. Completa il pagamento\n5. Le nuove funzionalità saranno attivate immediatamente\n\nTutti i dati esistenti vengono conservati.",
      zh: "**升级您的计划**的步骤：\n\n1. 前往**仪表盘**或**账户设置**\n2. 点击**升级计划**或**管理订阅**\n3. 选择您想要的新计划\n4. 通过 Lemon Squeezy 完成付款\n5. 新功能将立即激活\n\n升级时，您只需支付剩余计费期间的差价。所有现有数据都会保留。",
      ja: "**プランのアップグレード**方法：\n\n1. **ダッシュボード**または**アカウント設定**に移動\n2. **プランをアップグレード**をクリック\n3. 新しいプランを選択\n4. 支払いを完了\n5. 新機能が即座に有効化\n\n既存のデータはすべて保持されます。",
      ko: "**플랜 업그레이드** 방법:\n\n1. **대시보드** 또는 **계정 설정**으로 이동\n2. **플랜 업그레이드** 클릭\n3. 새 플랜 선택\n4. 결제 완료\n5. 새 기능이 즉시 활성화됩니다\n\n기존 데이터는 모두 보존됩니다.",
    },
  },
  {
    keywords: ["how to use", "usage guide", "feature details", "getting started", "features"],
    response: {
      en: "Here's a quick guide to using our main features:\n\n**Risk Classification** (All plans):\nDashboard → Risk Classification → Select AI System → Answer questionnaire → View results\n\n**Prohibited AI Practices Check** (Starter+):\nDashboard → Prohibited AI Practices → Select AI System → Complete 8-point checklist\n\n**Transparency Check** (Starter+):\nDashboard → Transparency Check → Select AI System → Complete 5-point verification\n\n**Document Generation** (Professional+):\nDashboard → Select AI System → Choose document type → Click Generate → Download\n\n**One-Click Generator** (All paid plans):\nDashboard → One-Click Compliance Generator → Select AI System → Generate All Documents\n\nWould you like more details on any specific feature?",
      de: "Hier ist eine Kurzanleitung zu unseren Hauptfunktionen:\n\n**Risikoklassifizierung** (Alle Pläne):\nDashboard → Risikoklassifizierung → KI-System wählen → Fragebogen beantworten\n\n**Prüfung unzulässiger KI-Praktiken** (Starter+):\nDashboard → Unzulässige KI-Praktiken → KI-System wählen → Checkliste ausfüllen\n\n**Dokumentgenerierung** (Professional+):\nDashboard → KI-System wählen → Dokumenttyp wählen → Generieren → Herunterladen",
      fr: "Voici un guide rapide de nos principales fonctionnalités :\n\n**Classification des risques** (Tous les plans) :\nTableau de bord → Classification des risques → Sélectionner système IA → Répondre au questionnaire\n\n**Vérification des pratiques interdites** (Starter+) :\nTableau de bord → Pratiques interdites → Sélectionner système IA → Remplir la checkliste\n\n**Génération de documents** (Professional+) :\nTableau de bord → Sélectionner système IA → Choisir le type → Générer → Télécharger",
      es: "Aquí tienes una guía rápida de nuestras principales funciones:\n\n**Clasificación de riesgos** (Todos los planes):\nPanel → Clasificación de riesgos → Seleccionar sistema IA → Responder cuestionario\n\n**Verificación de prácticas prohibidas** (Starter+):\nPanel → Prácticas prohibidas → Seleccionar sistema IA → Completar checklista\n\n**Generación de documentos** (Professional+):\nPanel → Seleccionar sistema IA → Elegir tipo → Generar → Descargar",
      it: "Ecco una guida rapida alle nostre funzionalità principali:\n\n**Classificazione dei rischi** (Tutti i piani):\nDashboard → Classificazione dei rischi → Selezionare sistema IA → Rispondere al questionario\n\n**Verifica delle pratiche vietate** (Starter+):\nDashboard → Pratiche vietate → Selezionare sistema IA → Completare checklist\n\n**Generazione di documenti** (Professional+):\nDashboard → Selezionare sistema IA → Scegliere tipo → Generare → Scaricare",
      zh: "以下是使用我们主要功能的快速指南：\n\n**风险分级**（所有计划）：\n仪表盘 → 风险分级 → 选择 AI 系统 → 回答问卷 → 查看结果\n\n**禁止性 AI 实践检查**（入门版+）：\n仪表盘 → 禁止性 AI 实践 → 选择 AI 系统 → 完成8项检查清单\n\n**透明度检查**（入门版+）：\n仪表盘 → 透明度检查 → 选择 AI 系统 → 完成5项验证\n\n**文档生成**（专业版+）：\n仪表盘 → 选择 AI 系统 → 选择文档类型 → 点击生成 → 下载\n\n**一键生成器**（所有付费计划）：\n仪表盘 → 一键合规生成器 → 选择 AI 系统 → 生成所有文档\n\n需要了解某个特定功能的更多详情吗？",
      ja: "主な機能の使い方ガイド：\n\n**リスク分類**（すべてのプラン）：\nダッシュボード → リスク分類 → AI システム選択 → アンケート回答 → 結果確認\n\n**禁止AI行為チェック**（スターター+）：\nダッシュボード → 禁止AI行為 → AI システム選択 → チェックリスト完了\n\n**文書生成**（プロフェッショナル+）：\nダッシュボード → AI システム選択 → 文書タイプ選択 → 生成 → ダウンロード",
      ko: "주요 기능 사용 가이드:\n\n**리스크 분류** (모든 플랜):\n대시보드 → 리스크 분류 → AI 시스템 선택 → 설문지 답변 → 결과 확인\n\n**금지 AI 관행 점검** (스타터+):\n대시보드 → 금지 AI 관행 → AI 시스템 선택 → 체크리스트 완료\n\n**문서 생성** (프로페셔널+):\n대시보드 → AI 시스템 선택 → 문서 유형 선택 → 생성 → 다운로드",
    },
  },
  {
    keywords: ["language", "switch language", "change language", "multilingual", "translate", "8 languages"],
    response: {
      en: "Our platform supports **8 languages**: English, German, French, Spanish, Italian, Chinese (Simplified), Japanese, and Korean.\n\n**To switch languages:**\n1. Click the **Language** button in the header navigation\n2. Select your preferred language\n3. The entire interface will update to your selected language\n\nAll compliance documents and reports can also be generated in multiple languages.",
      de: "Unsere Plattform unterstützt **8 Sprachen**. **So wechseln Sie die Sprache:**\n1. Klicken Sie auf **Sprache** in der Navigation\n2. Wählen Sie Ihre bevorzugte Sprache\n3. Die Oberfläche wird aktualisiert",
      fr: "Notre plateforme prend en charge **8 langues**. **Pour changer de langue :**\n1. Cliquez sur **Langue** dans la navigation\n2. Sélectionnez votre langue préférée\n3. L'interface se mettra à jour",
      es: "Nuestra plataforma admite **8 idiomas**. **Para cambiar de idioma:**\n1. Haga clic en **Idioma** en la navegación\n2. Seleccione su idioma preferido\n3. La interfaz se actualizará",
      it: "La nostra piattaforma supporta **8 lingue**. **Per cambiare lingua:**\n1. Fai clic su **Lingua** nella navigazione\n2. Seleziona la lingua preferita\n3. L'interfaccia si aggiornerà",
      zh: "我们的平台支持**8种语言**：英语、德语、法语、西班牙语、意大利语、中文（简体）、日语和韩语。\n\n**切换语言的方法：**\n1. 点击头部导航栏中的**语言**按钮\n2. 选择您偏好的语言\n3. 整个界面将更新为您选择的语言",
      ja: "当プラットフォームは**8言語**をサポートしています。**言語切替方法：**\n1. ヘッダーの**言語**ボタンをクリック\n2. 希望の言語を選択\n3. インターフェースが更新されます",
      ko: "당사 플랫폼은 **8개 언어**를 지원합니다. **언어 변경 방법:**\n1. 헤더 내비게이션의 **언어** 버튼 클릭\n2. 원하는 언어 선택\n3. 인터페이스가 업데이트됩니다",
    },
  },
];

const defaultResponses: { [locale: string]: string } = {
  en: "I can help you with the following topics:\n\n- **Plan Comparison** - Compare our 5 pricing tiers (Free, Starter, Professional, Business, Enterprise)\n- **Payment Guide** - How to subscribe and manage payments\n- **Usage Guide** - How to use risk assessment, prohibited practices check, transparency check, and other tools\n- **Feature Details** - Learn about specific features like FRIA, QMS, Shadow AI detection, API access, and more\n\nTry asking about any of these topics, or click the quick action buttons above!",
  de: "Ich kann Ihnen bei folgenden Themen helfen:\n\n- **Planvergleich** - Vergleichen Sie unsere 5 Preiskategorien\n- **Zahlungsanleitung** - So abonnieren und verwalten Sie Zahlungen\n- **Nutzungsanleitung** - So verwenden Sie die Tools\n- **Funktionsdetails** - Erfahren Sie mehr über spezifische Funktionen\n\nFragen Sie nach einem dieser Themen oder klicken Sie auf die Schnellaktions-Schaltflächen!",
  fr: "Je peux vous aider avec les sujets suivants :\n\n- **Comparaison des forfaits** - Comparez nos 5 niveaux de prix\n- **Guide de paiement** - Comment s'abonner et gérer les paiements\n- **Guide d'utilisation** - Comment utiliser les outils\n- **Détails des fonctionnalités** - En savoir plus sur les fonctionnalités\n\nPosez des questions sur ces sujets ou cliquez sur les boutons d'actions rapides !",
  es: "Puedo ayudarle con los siguientes temas:\n\n- **Comparación de planes** - Compare nuestros 5 niveles de precios\n- **Guía de pago** - Cómo suscribirse y gestionar pagos\n- **Guía de uso** - Cómo usar las herramientas\n- **Detalles de funciones** - Más sobre funciones específicas\n\nPregunte sobre estos temas o haga clic en los botones de acciones rápidas!",
  it: "Posso aiutarvi con i seguenti argomenti:\n\n- **Confronto piani** - Confronta i nostri 5 livelli di prezzo\n- **Guida al pagamento** - Come abbonarsi e gestire i pagamenti\n- **Guida all'uso** - Come usare gli strumenti\n- **Dettagli funzionalità** - Ulteriori informazioni sulle funzionalità\n\nChiedete informazioni su questi argomenti o fate clic sui pulsanti delle azioni rapide!",
  zh: "我可以帮助您了解以下主题：\n\n- **套餐对比** - 比较我们的5个定价等级（免费、入门版、专业版、商业版、企业版）\n- **支付指南** - 如何订阅和管理付款\n- **使用指南** - 如何使用风险评估、禁止性实践检查、透明度检查等工具\n- **功能详情** - 了解 FRIA、QMS、影子 AI 检测、API 访问等特定功能\n\n请尝试询问以上任何主题，或点击上方的快捷操作按钮！",
  ja: "以下のトピックについてお手伝いできます：\n\n- **プラン比較** - 5つの価格ティアを比較\n- **お支払いガイド** - 購読と支払い管理\n- **利用ガイド** - ツールの使い方\n- **機能詳細** - 特定の機能について\n\nこれらのトピックについて質問するか、クイックアクションボタンをクリックしてください！",
  ko: "다음 주제에 대해 도와드릴 수 있습니다:\n\n- **요금제 비교** - 5가지 가격 등급 비교\n- **결제 가이드** - 구독 및 결제 관리\n- **사용 가이드** - 도구 사용 방법\n- **기능 상세** - 특정 기능에 대한 자세한 정보\n\n이러한 주제에 대해 질문하시거나 빠른 작업 버튼을 클릭하세요!",
};

/**
 * Calculate semantic similarity score between query and knowledge base entry
 * Uses keyword matching + synonym expansion + n-gram overlap
 * contextRef: React ref holding per-instance conversation state (SSR-safe)
 */
function calculateMatchScore(
  query: string,
  entry: KnowledgeBaseEntry,
  contextRef: React.RefObject<{ lastCategory: string | null; lastKeywords: string[] }>
): number {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/);
  let score = 0;

  // Direct keyword matching (weighted by keyword length)
  for (const keyword of entry.keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerQuery.includes(lowerKeyword)) {
      score += lowerKeyword.split(" ").length * 2;
    }
  }

  // Synonym matching
  if (entry.synonyms) {
    for (const synonym of entry.synonyms) {
      const lowerSynonym = synonym.toLowerCase();
      if (lowerQuery.includes(lowerSynonym)) {
        score += lowerSynonym.split(" ").length * 1.5;
      }
    }
  }

  // Word-level overlap (partial matching)
  const allTerms = [...entry.keywords];
  if (entry.synonyms) {
    allTerms.push(...entry.synonyms);
  }

  for (const term of allTerms) {
    const termWords = term.toLowerCase().split(" ");
    for (const termWord of termWords) {
      if (termWord.length > 2 && queryWords.includes(termWord)) {
        score += 0.5;
      }
    }
  }

  // Context boost: if query matches previous conversation category
  const ctx = contextRef.current;
  if (ctx && ctx.lastCategory && entry.category === ctx.lastCategory) {
    score += 1;
  }

  return score;
}

/**
 * Check if query is a follow-up question (short, pronoun-heavy, no clear topic)
 */
function isFollowUpQuestion(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  const followUpPatterns = [
    "what about",
    "how about",
    "and ",
    "what else",
    "tell me more",
    "more details",
    "can you",
    "could you",
    "is it",
    "does it",
    "will it",
    "how much",
    "how many",
    "which one",
    "that too",
    "also",
  ];

  // Short queries (likely follow-ups)
  if (lowerQuery.split(" ").length <= 3) {
    return true;
  }

  // Contains follow-up patterns
  for (const pattern of followUpPatterns) {
    if (lowerQuery.startsWith(pattern) || lowerQuery.includes(" " + pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the best response using semantic matching with context awareness
 * contextRef: per-component-instance state (SSR-safe, no shared module state)
 */
function findBestResponse(
  query: string,
  locale: string,
  contextRef: React.RefObject<{ lastCategory: string | null; lastKeywords: string[] }>
): string {
  const ctx = contextRef.current;

  // Handle follow-up questions using conversation context
  if (isFollowUpQuestion(query) && ctx && ctx.lastCategory) {
    // Find entries in the same category
    const categoryEntries = knowledgeBase.filter(
      (e) => e.category === ctx.lastCategory
    );
    if (categoryEntries.length > 0) {
      // Pick the most relevant one that wasn't the last response
      const bestFollowUp = categoryEntries.reduce((best, entry) => {
        const score = calculateMatchScore(query, entry, contextRef);
        return score > calculateMatchScore(query, best, contextRef) ? entry : best;
      }, categoryEntries[0]!);

      const response = bestFollowUp.response[locale] || bestFollowUp.response["en"] || "";
      if (bestFollowUp.followUp) {
        const followUp = bestFollowUp.followUp[locale] || bestFollowUp.followUp["en"];
        if (followUp) {
          return response + "\n\n" + followUp;
        }
      }
      return response;
    }
  }

  // Normal matching
  let bestMatch: KnowledgeBaseEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    const score = calculateMatchScore(query, entry, contextRef);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Threshold: require at least some meaningful match
  if (bestMatch && bestScore >= 1) {
    // Update conversation context
    if (ctx) {
      ctx.lastCategory = bestMatch.category ?? null;
      ctx.lastKeywords = bestMatch.keywords;
    }

    let response = bestMatch.response[locale] || bestMatch.response["en"] || "";

    // Append follow-up suggestion if available
    if (bestMatch.followUp) {
      const followUp = bestMatch.followUp[locale] || bestMatch.followUp["en"];
      if (followUp) {
        response += "\n\n" + followUp;
      }
    }

    return response;
  }

  // No good match found - return default with context-aware suggestion
  const defaultResponse = defaultResponses[locale] || defaultResponses["en"] || "";

  // If we have context, suggest related topics
  if (ctx && ctx.lastCategory) {
    const relatedEntries = knowledgeBase.filter(
      (e) =>
        e.category === ctx.lastCategory &&
        !ctx.lastKeywords.some((k) => e.keywords.includes(k))
    );
    if (relatedEntries.length > 0) {
      const related = relatedEntries[0]!;
      const relatedResponse = related.response[locale] || related.response["en"] || "";
      return defaultResponse + "\n\n" + relatedResponse;
    }
  }

  return defaultResponse;
}

export default function ConsultationWidget() {
  const t = useTranslations("consultation");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Per-instance conversation context (SSR-safe, no shared module state)
  const contextRef = useRef<{ lastCategory: string | null; lastKeywords: string[] }>({
    lastCategory: null,
    lastKeywords: [],
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  // Show welcome message when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t("welcome"),
        },
      ]);
    }
  }, [isOpen, messages.length, t]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(
    (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      setTimeout(() => {
        const response = findBestResponse(messageText, locale, contextRef);
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 600 + Math.random() * 800);
    },
    [input, locale]
  );

  // Expose widget control to window for programmatic access (e.g., CDP testing)
  useEffect(() => {
    const widgetApi = {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      send: (text: string) => handleSend(text),
    };
    (window as unknown as Record<string, unknown>).__chatWidget = widgetApi;
    return () => {
      delete (window as unknown as Record<string, unknown>).__chatWidget;
    };
  }, [handleSend]);

  // All click interactions are handled via React onClick handlers on the elements directly.
  // No native event delegation needed — this avoids conflicts with React's synthetic event system.

  const quickActions = [
    { label: t("planComparison"), query: "plan comparison" },
    { label: t("paymentGuide"), query: "payment" },
    { label: t("usageGuide"), query: "how to use features" },
    { label: t("featureDetails"), query: "feature details" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Floating Button */}
      <button
        data-action="toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          "pointer-events-auto fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        }
        aria-label={isOpen ? "Close chat" : "Open consultation chat"}
      >
        {isOpen ? (
          <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={
          "pointer-events-auto fixed bottom-24 right-6 z-[100] flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all duration-300 ease-in-out " +
          (isOpen
            ? "h-[500px] w-[380px] translate-y-0 opacity-100"
            : "h-0 w-[380px] translate-y-4 opacity-0 pointer-events-none")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
          <button
            data-action="close"
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="Close chat"
          >
            <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2">
          {quickActions.map((action) => (
            <button
              key={action.query}
              data-action="quick"
              data-query={action.query}
              onClick={() => handleSend(action.query)}
              className="pointer-events-auto flex-shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                "mb-3 " +
                (message.role === "user" ? "flex justify-end" : "flex justify-start")
              }
            >
              <div
                className={
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed " +
                  (message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground")
                }
              >
                {message.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>{part.slice(2, -2)}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                    {i < message.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="mb-3 flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                {t("typing")}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 border-t border-border bg-background px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("placeholder")}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            data-action="send"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("send")}
          >
            <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
