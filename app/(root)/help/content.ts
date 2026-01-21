export type HelpFaq = {
  question: string;
  answer: string;
};

export type HelpContent = {
  title: string;
  subtitle: string;
  promiseLabel: string;
  promiseText: string;
  philosophy: Array<{
    title: string;
    body: string;
    titleClassName: string;
  }>;
  communityQuestionsTitle: string;
  faqs: HelpFaq[];
  joinTitle: string;
  joinBody: string;
  joinDiscord: string;
  joinEmail: string;
  joinFootnote: string;
};

export const enHelpContent: HelpContent = {
  title: 'Community Help Center',
  subtitle:
    'Free help, guided by community, powered by the belief that everyone deserves support',
  promiseLabel: 'Our Promise',
  promiseText: 'Every question matters. Every beginner is welcomed. No exclusion, ever.',
  philosophy: [
    {
      title: 'Learn Together',
      titleClassName: 'text-blue-500',
      body: `Every expert was once a beginner. Our guides are written by the community, for the community.
No jargon, no assumptions about prior knowledge.`,
    },
    {
      title: 'Community Support',
      titleClassName: 'text-green-500',
      body: `Real people helping real people. Our Discord community includes students, professionals,
and mentors who genuinely want to help you succeed.`,
    },
    {
      title: 'Built with Care',
      titleClassName: 'text-purple-500',
      body: `Every feature is designed with accessibility and ease-of-use in mind.
We believe powerful tools should be simple to use.`,
    },
  ],
  communityQuestionsTitle: 'Community Questions',
  faqs: [
    {
      question: 'Is OpenStock really free forever?',
      answer:
        "Yes! We're part of the Open Dev Society, which means we'll never lock knowledge behind paywalls. Core features remain free always. We run on community donations and the belief that financial tools should be accessible to everyone.",
    },
    {
      question: "I'm a student - can I use this for my projects?",
      answer:
        "Absolutely! That's exactly why we built this. Use it for school projects, learning, or building your portfolio. Need help? Our community loves mentoring students. Email student@opendevsociety.org for extra support.",
    },
    {
      question: 'How do I add stocks to my favorites?',
      answer:
        'Navigate to any stock page and click the star icon. You can also search using the search bar and add directly from results. Everything is designed to be intuitive - no complex tutorials needed.',
    },
    {
      question: 'Can I contribute to OpenStock?',
      answer:
        "We'd love that! OpenStock is open source and community-driven. Check our GitHub for issues marked 'good first issue' or 'help wanted'. Every contribution, no matter how small, makes a difference.",
    },
    {
      question: 'What if I find a bug or have a feature request?',
      answer:
        'Please tell us! Submit issues on GitHub, join our Discord, or email opendevsociety@gmail.com. We see every report as a chance to make the platform better for everyone.',
    },
  ],
  joinTitle: 'Join Our Community',
  joinBody:
    "Don't struggle alone. Our community of builders, learners, and dreamers is here to help.\nBecause we believe the future belongs to those who build it openly.",
  joinDiscord: 'Join Discord Community',
  joinEmail: 'Email Help Team',
  joinFootnote: "All support is free, always. We're here because we care, not for profit.",
};

export const zhHelpContent: HelpContent = {
  title: '社区帮助中心',
  subtitle: '免费帮助，社区驱动；我们相信每个人都值得被支持',
  promiseLabel: '我们的承诺',
  promiseText: '每一个问题都重要。每一位新手都受欢迎。绝不排斥任何人。',
  philosophy: [
    {
      title: '一起学习',
      titleClassName: 'text-blue-500',
      body: `每位专家都曾是新手。我们的指南由社区撰写、为社区服务。
不堆术语、不默认你已有基础。`,
    },
    {
      title: '社区支持',
      titleClassName: 'text-green-500',
      body: `真实的人帮助真实的人。我们的 Discord 社区里有学生、从业者和导师，
大家都真心希望你能成长。`,
    },
    {
      title: '用心打造',
      titleClassName: 'text-purple-500',
      body: `每个功能都以可访问性与易用性为先。
我们相信强大的工具也应该简单好用。`,
    },
  ],
  communityQuestionsTitle: '社区常见问题',
  faqs: [
    {
      question: 'OpenStock 真的会一直免费吗？',
      answer:
        '是的！我们是 Open Dev Society 的一部分，这意味着我们不会把知识锁在付费墙后。核心功能会一直免费。我们依靠社区捐助与“金融工具应人人可用”的信念运作。',
    },
    {
      question: '我是学生，可以用它做课程/项目吗？',
      answer:
        '当然可以！这正是我们打造它的原因。你可以用于课程作业、学习、或完善你的作品集。需要帮助？我们的社区非常愿意指导新手。也可以邮件联系 student@opendevsociety.org 获取额外支持。',
    },
    {
      question: '如何把股票加入收藏/关注？',
      answer:
        '打开任意股票详情页，点击星标按钮即可。你也可以用搜索框搜索，然后在结果里直接添加。整体设计追求直观易用，不需要复杂教程。',
    },
    {
      question: '我可以参与贡献 OpenStock 吗？',
      answer:
        '非常欢迎！OpenStock 是开源并由社区驱动的。你可以在 GitHub 上查看标注为 “good first issue” 或 “help wanted” 的问题。每一份贡献都很重要。',
    },
    {
      question: '发现 Bug 或有功能建议怎么办？',
      answer:
        '请一定告诉我们！你可以在 GitHub 提 Issue，加入我们的 Discord，或发邮件到 opendevsociety@gmail.com。我们把每一次反馈都当作让产品变得更好的机会。',
    },
  ],
  joinTitle: '加入我们的社区',
  joinBody:
    '别一个人硬扛。我们的社区由开发者、学习者与追梦者组成，随时愿意帮你。\n因为我们相信：未来属于那些公开地构建的人。',
  joinDiscord: '加入 Discord 社区',
  joinEmail: '邮件联系支持团队',
  joinFootnote: '所有支持始终免费。我们在这里是因为在乎，而不是为了盈利。',
};

