import { StoryProject } from '../types/story';

export const SAMPLE_DETECTIVE_PROJECT: StoryProject = {
  id: 'baron-mystery-01',
  title: 'لغز قصر البارون المفقود - خريطة القصة والتحقيق',
  description: 'مخطط رواية بوليسية غامضة تدور أحداثها في قصر معزول في ليلة عاصفة شتوية، حيث تختفي وصية البارون وتتشابك خيوط الشك بين الحاضرين.',
  version: 1,
  lastSavedAt: Date.now(),
  canvasView: {
    x: 0,
    y: 0,
    zoom: 0.95
  },
  nodes: [
    {
      id: 'node-char-1',
      title: 'المحقق كامل الشريف',
      content: 'محقق جنائي سابق، يتميز بذكاء حاد وملاحظة دقيقة للتفاصيل الصغيرة. وصل إلى القصر بدعوة غامضة قبل ليلة واحدة من وقوع الجريمة.',
      internalNotes: 'يجب إبراز ضعفه أمام الألغاز القديمة وتجنب جعله مثاليًا طوال الوقت. يخفي أيضًا أنه يعرف أحد أفراد العائلة منذ سنوات.',
      type: 'character',
      color: '#3b82f6',
      x: -450,
      y: -150,
      width: 310,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 1800000,
      tags: ['بطل القصة', 'محقق']
    },
    {
      id: 'node-char-2',
      title: 'البارون رشيد داوود',
      content: 'صاحب القصر الملياردير العجوز. يمتلك ثروة هائلة ومجموعة من التحف الأثرية النادرة. عُثر على غرفته مقفلة من الداخل والساعة الجدارية متوقفة تمامًا عند 11:45.',
      internalNotes: 'البارون لم يمت بشكل طبيعي كما يبدو للوهلة الأولى! هناك مادة منومة في فنجان الشاي الملكي.',
      type: 'character',
      color: '#3b82f6',
      x: -80,
      y: -280,
      width: 320,
      createdAt: Date.now() - 3500000,
      updatedAt: Date.now() - 1700000,
      tags: ['الضحية', 'صاحب القصر']
    },
    {
      id: 'node-event-1',
      title: 'انقطاع التيار الكهربائي في ليلة العاصفة',
      content: 'في الساعة 11:30 مساءً، هبت عاصفة رعدية شديدة قطعت خطوط الكهرباء عن الجبل بالكامل، وغرق القصر في ظلام دامس لمدة 20 دقيقة قبل تشغيل المولد الاحتياطي.',
      internalNotes: 'هذه هي النافذة الزمنية الوحيدة التي استغلها القاتل لتنفيذ خطته وسرقة الوصية من خزنة المكتبة.',
      type: 'event',
      color: '#f59e0b',
      x: -120,
      y: 40,
      width: 320,
      createdAt: Date.now() - 3400000,
      updatedAt: Date.now() - 1600000,
      tags: ['نقطة تحول', 'ذروة الفصل 2']
    },
    {
      id: 'node-secret-1',
      title: 'الوصية الثانية المخفية في ساعة الجد',
      content: 'البارون قام بتغيير وصيته سرًا قبل أسبوع من وفاته، وحرم ابن أخيه من الميراث بسبب اكتشافه لتورطه في عمليات اختلاس مالية من الشركة.',
      internalNotes: 'الوصية ليست في الخزنة الحديدية! إنها مخبأة داخل بندول الساعة الخشبية في الرواق الكبير.',
      type: 'secret',
      color: '#ef4444',
      x: 320,
      y: -180,
      width: 300,
      createdAt: Date.now() - 3300000,
      updatedAt: Date.now() - 1500000,
      tags: ['سر رئيسي', 'دافع الجريمة']
    },
    {
      id: 'node-char-3',
      title: 'الطبيب طارق منذر (ابن الأخ)',
      content: 'طبيب العائلة والمستفيد الأول من الوصية القديمة. يبدو هادئًا لكنه غارق في ديون قمار سرية في الخارج ويحتاج إلى الأموال بشكل عاجل.',
      internalNotes: 'هو المشتبه به الرئيسي طوال الفصول الثلاثة الأولى، لكن هل هو القاتل الحقيقي أم أداة في يد شخص آخر؟',
      type: 'character',
      color: '#3b82f6',
      x: 310,
      y: 120,
      width: 300,
      createdAt: Date.now() - 3200000,
      updatedAt: Date.now() - 1400000,
      tags: ['مشتبه به', 'طبيب']
    },
    {
      id: 'node-place-1',
      title: 'المكتبة الغربية وخزنة الحائط',
      content: 'مكتبة كلاسيكية ذات رفوف متحركة. تحتوي على ممر سري يربط بين غرفة المكتبة وغرفة البارون دون المرور بالممر الرئيسي المراقب.',
      internalNotes: 'يجب رسم خريطة صغيرة للقصر في الفصل الرابع لتوضيح كيفية تنقل الفاعل دون أن يراه أحد الحراس.',
      type: 'place',
      color: '#10b981',
      x: -480,
      y: 180,
      width: 300,
      createdAt: Date.now() - 3100000,
      updatedAt: Date.now() - 1300000,
      tags: ['مسرح الحدث', 'قصر']
    },
    {
      id: 'node-idea-1',
      title: 'فكرة حبكة بديلة للفصل الأخير',
      content: 'ماذا لو اكتشف المحقق أن الخادمة العجوز كانت الشاهدة الوحيدة، وأنها تركت إشارة سرية في فنجان الشاي قبل وصول الشرطة؟',
      internalNotes: 'يمكن اختيار هذه النهاية إذا أردنا إضافة بعد عاطفي لقصة ولاء الخدم للبارون منذ ثلاثين عامًا.',
      type: 'idea',
      color: '#ec4899',
      x: 280,
      y: 400,
      width: 310,
      createdAt: Date.now() - 3000000,
      updatedAt: Date.now() - 1200000,
      tags: ['عصف ذهني', 'احتمال']
    },
    {
      id: 'node-ending-1',
      title: 'المواجهة في صالون المدفأة (النهاية)',
      content: 'يجمع المحقق كامل كل المشتبه بهم في صالون المدفأة الكبير، ويكشف عن توقيت توقف الساعة الحقيقي، ويواجه القاتل بالدليل القاطع.',
      internalNotes: 'يجب أن تكون الجملة الأخيرة في الفصل مليئة بالتشويق وتترك بابًا مفتوحًا للجزء الثاني من السلسلة.',
      type: 'ending',
      color: '#8b5cf6',
      x: -120,
      y: 380,
      width: 330,
      createdAt: Date.now() - 2900000,
      updatedAt: Date.now() - 1100000,
      tags: ['الذروة', 'نهاية القصة']
    }
  ],
  connections: [
    {
      id: 'conn-1',
      fromNodeId: 'node-char-1',
      toNodeId: 'node-char-2',
      label: 'يكتشف',
      color: '#10b981',
      style: 'solid',
      createdAt: Date.now() - 2800000
    },
    {
      id: 'conn-2',
      fromNodeId: 'node-event-1',
      toNodeId: 'node-char-2',
      label: 'سبب',
      color: '#f59e0b',
      style: 'solid',
      createdAt: Date.now() - 2700000
    },
    {
      id: 'conn-3',
      fromNodeId: 'node-secret-1',
      toNodeId: 'node-char-3',
      label: 'سر',
      color: '#ef4444',
      style: 'dashed',
      createdAt: Date.now() - 2600000
    },
    {
      id: 'conn-4',
      fromNodeId: 'node-char-3',
      toNodeId: 'node-char-2',
      label: 'يقتل',
      color: '#dc2626',
      style: 'solid',
      createdAt: Date.now() - 2500000
    },
    {
      id: 'conn-5',
      fromNodeId: 'node-place-1',
      toNodeId: 'node-event-1',
      label: 'موقع الحدث',
      color: '#10b981',
      style: 'dotted',
      createdAt: Date.now() - 2400000
    },
    {
      id: 'conn-6',
      fromNodeId: 'node-secret-1',
      toNodeId: 'node-ending-1',
      label: 'يظهر لاحقًا',
      color: '#8b5cf6',
      style: 'dotted',
      createdAt: Date.now() - 2300000
    },
    {
      id: 'conn-7',
      fromNodeId: 'node-idea-1',
      toNodeId: 'node-ending-1',
      label: 'مرتبط بـ',
      color: '#ec4899',
      style: 'dashed',
      createdAt: Date.now() - 2200000
    }
  ]
};

export const BLANK_PROJECT_TEMPLATE: StoryProject = {
  id: 'new-story-' + Date.now(),
  title: 'مشروع رواية جديدة - بدون عنوان',
  description: 'لوحة عمل فارغة لبدء تخطيط الرواية والشخصيات والأحداث من الصفر.',
  version: 1,
  lastSavedAt: Date.now(),
  canvasView: { x: 0, y: 0, zoom: 1 },
  nodes: [
    {
      id: 'node-init-1',
      title: 'بطل القصة الرئيسي',
      content: 'اكتب هنا نبذة عن البطل: اسمه، هدفه الرئيسي، الصراع الداخلي، وأكبر مخاوفه.',
      internalNotes: 'ملاحظات الكاتب: ما الذي يتغير في شخصيته بحلول نهاية الرواية؟',
      type: 'character',
      color: '#3b82f6',
      x: -200,
      y: -100,
      width: 300,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['بطل']
    },
    {
      id: 'node-init-2',
      title: 'الحدث المحرك للقصة (Inciting Incident)',
      content: 'الحدث الذي يكسر الروتين اليومي للبطل ويجبره على خوض الرحلة أو المغامرة.',
      internalNotes: 'يجب أن يحدث هذا في نهاية الفصل الأول أو بداية الفصل الثاني.',
      type: 'event',
      color: '#f59e0b',
      x: 200,
      y: -100,
      width: 300,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['حدث رئيسي']
    }
  ],
  connections: [
    {
      id: 'conn-init-1',
      fromNodeId: 'node-init-1',
      toNodeId: 'node-init-2',
      label: 'مرتبط بـ',
      color: '#3b82f6',
      style: 'solid',
      createdAt: Date.now()
    }
  ]
};
