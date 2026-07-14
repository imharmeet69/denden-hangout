const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{!isGif && \([\s\S]*?\}\)[\s\S]*?\{isMe && !isGif && \([\s\S]*?\}\)/m;

const replacement = `                  <div className={\`flex items-center gap-2 mb-1 sm:mb-1.5 px-1 w-full \${isMe ? 'justify-end' : 'justify-between'}\`}>
                    <span className="text-xs text-slate-500 font-medium">
                      {msg.sender}
                    </span>
                    {isMe && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
