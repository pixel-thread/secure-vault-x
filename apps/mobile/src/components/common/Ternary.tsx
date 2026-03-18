type Props = {
  condition: boolean;
  ifTrue: React.ReactNode;
  ifFalse: React.ReactNode;
};
export const Ternary = ({ condition, ifTrue, ifFalse }: Props) => {
  return condition ? ifTrue : ifFalse;
};
