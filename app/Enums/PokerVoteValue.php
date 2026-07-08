<?php

namespace App\Enums;

enum PokerVoteValue: string
{
    case Unknown = '?';
    case Zero = '0';
    case One = '1';
    case Two = '2';
    case Three = '3';
    case Five = '5';
    case Eight = '8';
    case Thirteen = '13';
    case TwentyOne = '21';
    case ThirtyFour = '34';
    case FiftyFive = '55';
    case OneHundred = '100';
    case Coffee = 'coffee';

    /**
     * The numeric value used when calculating the average estimate.
     * Non-numeric votes (Unknown, Coffee) are excluded from averages.
     */
    public function numericValue(): ?float
    {
        return is_numeric($this->value) ? (float) $this->value : null;
    }

    public function label(): string
    {
        return match ($this) {
            self::Coffee => '☕',
            default => $this->value,
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }
}
